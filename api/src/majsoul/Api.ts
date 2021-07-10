import * as uuidv4 from "uuid/v4";
import { Root } from "protobufjs";
import fetch from "node-fetch";
import { Observable, using } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Contest, Player } from "./types/types";
import { Codec } from "./Codec";
import { MessageType } from "./types/MessageType";
import { Connection } from "./Connection";
import { RpcImplementation } from "./RpcImplementation";
import { RpcService } from "./Service";
import { ApiResources } from "./ApiResources";
import { GameRecord } from "./types/GameRecordResponse";
import { PlayerZone } from "./types";

export class Api {
	private static async getRes<T>(path: string): Promise<T> {
		return (await fetch(path)).json();
	}

	public static async retrieveApiResources(): Promise<ApiResources> {
		const majsoulUrl = "https://mahjongsoul.game.yo-star.com/";
		const versionInfo = await Api.getRes<any>(majsoulUrl + "version.json?randv=" + Math.random().toString().slice(2));
		const resInfo = await Api.getRes<any>(majsoulUrl + `resversion${versionInfo.version}.json`);
		const pbVersion = resInfo.res["res/proto/liqi.json"].prefix;
		const pbDef = await Api.getRes<any>(majsoulUrl + `${pbVersion}/res/proto/liqi.json`);
		const config = await Api.getRes<any>(majsoulUrl + `${resInfo.res["config.json"].prefix}/config.json`);
		const ipDef = config.ip.filter((x) => x.name === "player")[0];
		const serverListUrl = (ipDef.region_urls.mainland
			|| ipDef.region_urls[0].url) + "?service=ws-gateway&protocol=ws&ssl=true";
		const serverList = await Api.getRes<any>(serverListUrl);
		if (serverList.maintenance) {
			console.log("Maintenance in progress");
			return;
		}
		return {
			version: versionInfo.version,
			pbVersion,
			serverList: serverList,
			protobufDefinition: pbDef
		};
	}

	private readonly contestSystemMessagesSubscriptions: Record<number, number> = {};
	private readonly protobufRoot: Root;
	private readonly connection: Connection;
	private readonly rpc: RpcImplementation;
	private readonly lobbyService: RpcService;
	private readonly codec: Codec;
	public readonly notifications: Observable<any>;

	constructor(private readonly apiResources: ApiResources) {
		this.protobufRoot = Root.fromJSON(this.apiResources.protobufDefinition);
		this.codec = new Codec(this.protobufRoot);
		const serverIndex = Math.floor(Math.random() * this.apiResources.serverList.servers.length);
		this.connection = new Connection(`wss://${this.apiResources.serverList.servers[serverIndex]}`);
		this.notifications = this.connection.messages.pipe(filter(message => message.type === MessageType.Notification), map(message => this.codec.decode(message.data)));
		this.rpc = new RpcImplementation(this.connection, this.protobufRoot);
		this.lobbyService = this.rpc.getService("Lobby");
	}

	public static getPlayerZone(playerId: number): PlayerZone {
		if (isNaN(playerId)) {
			return PlayerZone.Unknown;
		}

		const regionBits = playerId >> 23;

		if (regionBits >= 0 && regionBits <= 6) {
			return PlayerZone.China;
		}

		if (regionBits >= 7 && regionBits <= 12) {
			return PlayerZone.Japan;
		}

		if (regionBits >= 13 && regionBits <= 15) {
			return PlayerZone.Other;
		}

		return PlayerZone.Unknown;
	}

	public get majsoulCodec(): Codec {
		return this.codec;
	}

	public async init(): Promise<void> {
		await this.connection.init();
	}

	public async logIn(userId: string, accessToken: string): Promise<void> {
		const passport = await (await fetch("https://passport.mahjongsoul.com/user/login", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				"uid": userId,
				"token": accessToken,
				"deviceId": `web|${userId}`
			})
		})).json();
		if (!passport) {
			console.log("no passport");
			return;
		}
		const type = 8;
		let resp = await this.lobbyService.rpcCall("oauth2Auth", {
			type,
			code: passport.accessToken,
			uid: passport.uid,
		});
		accessToken = resp.access_token;
		resp = await this.lobbyService.rpcCall("oauth2Check", { type, access_token: accessToken });
		if (!resp.has_account) {
			await new Promise((res) => setTimeout(res, 2000));
			resp = await this.lobbyService.rpcCall("oauth2Check", { type, access_token: accessToken });
		}
		resp = await this.lobbyService.rpcCall("oauth2Login", {
			type,
			access_token: accessToken,
			reconnect: false,
			device: { device_type: "pc", browser: "safari" },
			random_key: uuidv4(),
			client_version: this.apiResources.version,
		});
		if (!resp.account) {
			throw Error(`Couldn't log in to user id ${userId}`);
		}
		console.log(`Logged in as ${resp.account.nickname} account id ${resp.account_id}`);
		console.log("Connection ready");
	}

	public async findContestByContestId(id: number): Promise<Contest> {
		const resp = await this.lobbyService.rpcCall("fetchCustomizedContestByContestId", {
			contest_id: id,
		});

		if (!resp.contest_info) {
			return null;
		}

		return {
			majsoulId: resp.contest_info.unique_id,
			majsoulFriendlyId: resp.contest_info.contest_id,
			name: resp.contest_info.contest_name,
			createdTime: resp.contest_info.create_time * 1000,
			startTime: resp.contest_info.start_time * 1000,
			finishTime: resp.contest_info.finish_time * 1000,
		};
	}

	public async getContestGamesIds(id: number): Promise<{
		majsoulId: string;
	}[]> {
		let nextIndex = undefined;
		const idLog = {};
		while (true) {
			const resp = await this.lobbyService.rpcCall("fetchCustomizedContestGameRecords", {
				unique_id: id,
				last_index: nextIndex,
			});
			for (const game of resp.record_list) {
				idLog[game.uuid] = true;
			}
			if (!resp.next_index || !resp.record_list.length) {
				break;
			}
			nextIndex = resp.next_index;
		}
		return Object.keys(idLog).map(id => { return { majsoulId: id }; }).reverse();
	}

	public subscribeToContestChatSystemMessages(id: number): Observable<any> {
		return using(
			() => ({
				unsubscribe: () => {
					this.contestSystemMessagesSubscriptions[id]--;
					if (this.contestSystemMessagesSubscriptions[id] > 0) {
						return;
					}

					delete this.contestSystemMessagesSubscriptions[id];
					this.lobbyService.rpcCall("leaveCustomizedContestChatRoom", {});
					for (const id of Object.keys(this.contestSystemMessagesSubscriptions)) {
						this.lobbyService.rpcCall("joinCustomizedContestChatRoom", { unique_id: id });
					}
				}
			}),
			() => {
				if (this.contestSystemMessagesSubscriptions[id] == null) {
					this.contestSystemMessagesSubscriptions[id] = 1;
					this.lobbyService.rpcCall("joinCustomizedContestChatRoom", { unique_id: id });
				} else {
					this.contestSystemMessagesSubscriptions[id]++;
				}

				return this.notifications.pipe(
					filter(
						message => message.unique_id === id
						// && message.constructor.name === "NotifyCustomContestSystemMsg"
					)
				);
			}
		);
	}

	public async findPlayerByFriendlyId(majsoulFriendlyId: number): Promise<Player> {
		try {
			const resp = (await this.lobbyService.rpcCall("searchAccountByPattern", { pattern: majsoulFriendlyId.toString() }));
			if (!resp.decode_id) {
				return null;
			}

			const [player] = (await this.lobbyService.rpcCall("fetchMultiAccountBrief", { account_id_list: [resp.decode_id] })).players;
			return {
				majsoulId: player.account_id,
				nickname: player.nickname
			}
		} catch (e) {
			console.log(e);
			return null;
		}
	}

	public async getGame(id: string): Promise<GameRecord> {
		let resp;
		try {
			resp = (await this.lobbyService.rpcCall("fetchGameRecord", { game_uuid: id }));
			resp.records = this.codec.decode(resp.data).records.map((r) => this.codec.decode(r));
			return resp;
		}
		catch (e) {
			console.log(`Couldn't find game ${id}`);
			console.log(resp);
			return null;
		}
	}

	public dispose() {
		this.connection.close();
	}
}
