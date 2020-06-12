import * as uuidv4 from "uuid/v4";
import { Root } from "protobufjs";
import fetch from "node-fetch";
import { Observable, merge } from 'rxjs';
import { filter, map, share, tap } from 'rxjs/operators';
import { IGameResult, IContest } from "./types/types";
import { IRoundResult, IAgariInfo, DrawStatus, IRoundInfo } from "./types/types";
import { Han } from "./types/Han";
import { Codec } from "./Codec";
import { MessageType } from "./types/MessageType";
import { Connection } from "./Connection";
import { RpcImplementation } from "./RpcImplementation";
import { RpcService } from "./Service";
import { ApiResources } from "./ApiResources";

export class Api {
	private static async getRes<T>(path: string): Promise<T> {
		return (await fetch(path)).json();
	}

	public static async retrieveMahjsoulApiResources(): Promise<ApiResources> {
		const majsoulUrl = "https://mahjongsoul.game.yo-star.com/";
		const versionInfo = await Api.getRes<any>(majsoulUrl + "version.json?randv=" + Math.random().toString().slice(2));
		const resInfo = await Api.getRes<any>(majsoulUrl + `resversion${versionInfo.version}.json`);
		const pbVersion = resInfo.res["res/proto/liqi.json"].prefix;
		const pbDef = await Api.getRes<any>(majsoulUrl + `${pbVersion}/res/proto/liqi.json`);
		const config = await Api.getRes<any>(majsoulUrl + `${resInfo.res["config.json"].prefix}/config.json`);
		const ipDef = config.ip.filter((x) => x.name === "player")[0];
		const serverListUrl = (ipDef.region_urls.mainland
			|| ipDef.region_urls[Object.keys(ipDef.region_urls)[0]]) + "?service=ws-gateway&protocol=ws&ssl=true";
		const serverList = await Api.getRes<any>(serverListUrl);
		if (serverList.maintenance) {
			console.log("Maintenance in progress");
			return;
		}
		return {
			version: versionInfo.version,
			serverList: serverList,
			protobufDefinition: pbDef
		};
	}

	private readonly contestObservables: Observable<any>[] = [];
	private readonly protobufRoot: Root;
	private readonly connection: Connection;
	private readonly rpc: RpcImplementation;
	private readonly lobbyService: RpcService;
	private readonly codec: Codec;
	private readonly notifications: Observable<any>;

	constructor(private readonly apiResources: ApiResources) {
		this.protobufRoot = Root.fromJSON(this.apiResources.protobufDefinition);
		this.codec = new Codec(this.protobufRoot);
		const serverIndex = Math.floor(Math.random() * this.apiResources.serverList.servers.length);
		this.connection = new Connection(`wss://${this.apiResources.serverList.servers[serverIndex]}`);
		this.notifications = this.connection.messages.pipe(filter(message => message.type === MessageType.Notification), map(message => this.codec.decode(message.data)));
		this.rpc = new RpcImplementation(this.connection, this.protobufRoot);
		this.lobbyService = this.rpc.getService("Lobby");
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

	public async findContestByContestId(id: number): Promise<IContest> {
		const resp = await this.lobbyService.rpcCall("fetchCustomizedContestByContestId", {
			contest_id: id,
		});
		return {
			majsoulId: resp.contest_info.unique_id,
			contestId: resp.contest_info.contest_id,
			name: resp.contest_info.contest_name,
			sessions: [],
			teams: []
		};
	}

	public async getContestGamesIds(id: number): Promise<{
		id: string;
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
		return Object.keys(idLog).map(id => { return { id }; }).reverse();
	}

	public subscribeToContestChatSystemMessages(id: number): Observable<any> {
		const observable = this.contestObservables[id];
		if (observable) {
			return observable;
		}
		return this.contestObservables[id] = merge(this.notifications.pipe(tap(m => console.log(m)), filter(message => message.constructor.name === "NotifyCustomContestSystemMsg"
			&& message.unique_id === id)), new Observable<string>((subscriber) => {
				console.log("subscribed");
				this.lobbyService.rpcCall("joinCustomizedContestChatRoom", { unique_id: id });
				return () => {
					console.log("unsubscribed");
					this.lobbyService.rpcCall("leaveCustomizedContestChatRoom", {}).then(() => {
						delete this.contestObservables[id];
						for (const contest of Object.keys(this.contestObservables)) {
							this.lobbyService.rpcCall("joinCustomizedContestChatRoom", { unique_id: contest });
						}
					});
				};
			})).pipe(share());
	}

	public async getGame(id: string): Promise<IGameResult> {
		let resp, records;
		try {
			resp = (await this.lobbyService.rpcCall("fetchGameRecord", { game_uuid: id }));
			records = this.codec.decode(resp.data).records.map((r) => this.codec.decode(r));
		}
		catch (e) {
			console.log(`Couldn't find game ${id}`);
			console.log(resp);
			return null;
		}
		const hands: IRoundResult[] = [];
		let lastDiscardSeat: number;
		let round: IRoundInfo;
		for (const record of records) {
			switch (record.constructor.name) {
				case "RecordNewRound": {
					round = {
						round: record.chang,
						dealership: record.ju,
						repeat: record.ben
					};
					break;
				}
				case "RecordDiscardTile": {
					lastDiscardSeat = record.seat;
					break;
				}
				case "RecordNoTile": {
					if (!round) {
						console.log("Missing hand for NoTile event");
						continue;
					}
					hands.push({
						round,
						draw: {
							playerDrawStatus: (record.players as any[]).map((player, index) => {
								if (record.liujumanguan && (record.scores as any[]).find(score => score.seat === index)) {
									return DrawStatus.Nagashi_Mangan;
								}
								return player.tingpai ? DrawStatus.Tenpai : DrawStatus.Noten;
							})
						}
					});
					round = null;
					break;
				}
				case "RecordHule": {
					if (!round) {
						console.log("Missing hand for Hule event");
						continue;
					}
					if (record.hules[0].zimo) {
						const hule = record.hules[0];
						hands.push({
							round,
							tsumo: {
								...this.getAgariRecord(record, hule, round),
								dealerValue: hule.point_zimo_qin,
							}
						});
						round = null;
						break;
					}
					hands.push({
						round,
						rons: (record.hules as any[]).map(hule => {
							return {
								...this.getAgariRecord(record, hule, round),
								loser: lastDiscardSeat
							};
						})
					});
					lastDiscardSeat = null;
					round = null;
					break;
				}
			}
		}
		if (!resp.data_url && !(resp.data && resp.data.length)) {
			console.log(`No data in response: ${id}`);
			return;
		}
		return {
			id: undefined,
			contestId: resp.head.config ? resp.head.config.meta ? resp.head.config.meta.contest_uid : null : null,
			majsoulId: id,
			start_time: resp.head.start_time,
			end_time: resp.head.end_time,
			players: (resp.head.accounts as any[]).map(account => ({
				nickname: account.nickname,
				displayName: undefined,
				_id: undefined,
				majsoulId: account.account_id,
			})),
			finalScore: (resp.head.accounts as any[]).map(account => {
				const playerItem = resp.head.result.players.find(b => b.seat === account.seat);
				return {
					score: playerItem.part_point_1,
					uma: playerItem.total_point / 1000,
				};
			}),
			rounds: hands
		};
	}

	public dispose() {
		this.connection.close();
	}

	private getAgariRecord(record: any, hule: any, round: IRoundInfo): IAgariInfo {
		const value = hule.zimo
			? (hule.seat === round.dealership
				? hule.point_zimo_xian * 3
				: hule.point_zimo_qin + hule.point_zimo_xian * 2)
			: hule.point_rong - (hule.riqi ? 1000 : 0);
		return {
			extras: record.delta_scores[hule.seat] - value - (hule.riqi ? 1000 : 0),
			value,
			winner: hule.seat,
			han: (hule.fans as any[]).map(f => {
				if ([Han.Dora, Han.Red_Five, Han.Ura_Dora].indexOf(f.id) >= 0) {
					return Array(f.val).fill(f.id);
				}
				return [f.id];
			}).flat()
		};
	}
}
