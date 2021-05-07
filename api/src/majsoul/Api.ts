import * as uuidv4 from "uuid/v4";
import { Root } from "protobufjs";
import fetch from "node-fetch";
import { Observable, using } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { GameResult, Contest, Player } from "./types/types";
import { RoundResult, AgariInfo, RoundInfo } from "./types/types";
import { DrawStatus } from "./types/DrawStatus";
import { Han } from "./types/Han";
import { Codec } from "./Codec";
import { MessageType } from "./types/MessageType";
import { Connection } from "./Connection";
import { RpcImplementation } from "./RpcImplementation";
import { RpcService } from "./Service";
import { ApiResources } from "./ApiResources";
import { PlayerGameStats } from "./types/Stats";
import { HaiArr, syanten, syanten7, syanten13 } from "syanten";

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

    private handValue(hule: any, dealer_seat:number, honba: number, np: number): number {
        //won't work with pao
        let val = (np - 1) * 100 * honba;
        if (hule.zimo) {
            if (dealer_seat == hule.seat)
                val += (np - 1) * hule.point_zimo_xian;
            else
                val += hule.point_zimo_qin + (np - 2) * hule.point_zimo_xian;
        } else
            val += (np - 2) * hule.point_rong;

        return val;
    }

    private handShanten(hand: string[]): number {
        const tcon = { m: 0, p: 1, s: 2, z: 3 };
        const hai: HaiArr = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ];
        let tiles = 0;

        hand.forEach(t =>  {
            let num: number  = parseInt(t[0]);
            if (0 == num)
                num = 5;
            let suit = t[1];
            tiles++;
            hai[tcon[suit]][num - 1]++;
        });

        return Math.min(syanten(hai), syanten7(hai), syanten13(hai));
    }

    public async getGame(id: string): Promise<GameResult> {
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

        const np: number = 4;
        const hands: RoundResult[] = [];
        const stats: PlayerGameStats[] = [];
        let round: RoundInfo;
        let lastDiscardSeat: number;
        let leftover_riichi_sticks: number;
        let active_riichis    = null;
        let kan_lock          = null;
        let active_open_hands = null;
        let turn_counters     = null;
        let repeat_series = 0;

        for (let p = 0; p < np; p++)
            stats.push(new PlayerGameStats());

        if (!records ||  "RecordNewRound" != records[0].constructor.name) {
            console.log("Game record does not start with RecordNewRound");
            return null;
        }

        for (const i in records) {
            const record = records[i];
            let record_next = (records.length <= i) ? records[i+1] : null;
            switch (record.constructor.name) {
                case "RecordNewRound": {
                    //repeat streaks
                    if (round && round.dealership == record.ju) {
                        stats[round.dealership].dealer.repeats++;
                        repeat_series++;
                        if (repeat_series > stats[round.dealership].dealer.max_repeats)
                            stats[round.dealership].dealer.max_repeats = repeat_series;
                    } else
                        repeat_series = 0;

                    round = {
                        round: record.chang,
                        dealership: record.ju,
                        repeat: record.ben
                    };
                    //
                    leftover_riichi_sticks = record.liqibang;
                    active_riichis     = new Set();
                    kan_lock           = new Set();
                    active_open_hands  = new Set();
                    turn_counters      = new Array(np).fill(0);
                    stats.forEach(p => p.nhands++);
                    stats[round.dealership].turns.total++; //dealer's 'draw'
                    stats[round.dealership].dealer.rounds++;
                    turn_counters[round.dealership]++;
                    for (let p = 0; p < np; p++)
                        stats[p].shanten += this.handShanten(record['tiles'+p]);
                    break;
                }
                case "RecordDiscardTile": {
                    lastDiscardSeat = record.seat;
                    //riichis
                    if (record.is_wliqi)
                        stats[record.seat].riichi.daburiichi++;
                    if (record.is_wliqi || record.is_liqi) {
                        stats[record.seat].riichi.total++;
                        stats[record.seat].turns.riichi += turn_counters[record.seat];
                        //furiten
                        if (record.zhenting[record.seat])
                            stats[record.seat].riichi.furiten++;
                        //chase
                        if (active_riichis.size) {
                            stats[record.seat].riichi.chase++;
                            active_riichis.forEach((p:number)  => stats[p].riichi.chased++);
                        } else
                            stats[record.seat].riichi.first++;
                        active_riichis.add(record.seat);
                        //check immediate deal-in
                        if (record_next && "RecordHule" == record_next.constructor.name)
                            stats[record.seat].riichi.immediate_dealin++;
                    }
                    //calls
                    if (records.length <= i) {
                        console.log("Game record ends with Discard event");
                        break;
                    }
                    if ("operations" in record) { //somebody can call this discard
                        //ignoring ron calls, get list of seats that can call
                        const calloppsp = new Set();
                        record.operations.filter(x => 9 != x.type).forEach(x => calloppsp.add(x.seat));

                        switch (record_next && record_next.constructor.name) {
                            case "RecordHule": { //somebody ronned. nobody could call anyways
                                break;
                            }
                            case "RecordChiPengGang": {
                                //somebody called
                                if (0 == records[i+1].type) { //somebody chii'd. count all
                                    calloppsp.forEach((p: number) => {
                                        stats[p].calls.opps++;
                                        stats[p].calls.opps_all++;
                                    });
                                } else { //pon, daiminkan. trumps chii
                                    stats[records[i+1].seat].calls.opps++;
                                    stats[records[i+1].seat].calls.opps_all++;
                                }
                                break;
                            }
                            default: { //all calls skipped
                                calloppsp.forEach((p: number) => {
                                    stats[p].calls.opps++;
                                    stats[p].calls.opps_all++;
                                });
                                break;
                            }
                        }
                    }
                    break;
                }
                case "RecordDealTile": {
                    turn_counters[record.seat]++;
                    stats[record.seat].turns.total++;
                    //shouminkan/ankan opportunity (types 4/6)
                    if ("operation_list" in record) {
                        const kans = record.operation_list.filter(e => (4 == e.type || 6 == e.type));
                        for (const kan of kans) {
                            stats[record.seat].calls.opps_all++;
                            if (!kan_lock.has(kan.combination[0])) {
                                stats[record.seat].calls.opps++;
                                kan_lock.add(kan.combination[0]);
                            }
                        }
                    }
                    break;
                }
                case "RecordAnGangAddGang": {
                    stats[record.seat].calls.total++;
                    break;
                }
                case "RecordChiPengGang": {
                    stats[record.seat].turns.total++;
                    turn_counters[record.seat]++;
                    stats[record.seat].calls.total++;
                    if (!active_open_hands.has(record.seat)) {
                        stats[record.seat].calls.opened_hands++;
                        active_open_hands.add(record.seat);
                    }
                    break;
                }
                case "RecordLiuJu": {
                    lastDiscardSeat = null;
                    break;
                }
                case "RecordNoTile": {
                    if (!round) {
                        console.log("Missing hand for NoTile event");
                        continue;
                    }
                    //
                    active_riichis.forEach((p: number) => stats[p].draws.riichi++);
                    active_open_hands.forEach((p: number) => stats[p].draws.open++);
                    for (const p in record.players) {
                        stats[p].draws.total++;
                        if (record.players[p].tingpai)
                            stats[p].draws.ten++;
                    }
                    for (const scores of record.scores)
                        if ("delta_scores" in scores) {
                            for (const p in scores.delta_scores) {
                                stats[p].draws.points += scores.delta_scores[p];
                                if (record.liujumanguan && 0 < scores.delta_scores[p])
                                    stats[p].draws.nagashi++;
                            }
                        };
                    //
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
                    lastDiscardSeat = null;
                    //round = null;
                    break;
                }
                case "RecordHule": {
                    if (!round) {
                        console.log("Missing hand for Hule event");
                        continue;
                    }
                    //sticks
                    let riichi_sticks = active_riichis.size + leftover_riichi_sticks;
                    if (active_riichis.has(record.hules[0].seat))
                        stats[record.hules[0].seat].riichi.sticks_kept++;
                    stats[record.hules[0].seat].riichi.sticks_won += riichi_sticks;
                    //categorize win
                    let honba = round.repeat;
                    for (const hule of record.hules) {
                        //general
                        let pts     = this.handValue(hule, round.dealership, honba, np);
                        let uradora = 0;
                        let akadora = 0;
                        let dora    = 0;
                        let ippatsu = false;
                        for (const yaku of hule.fans) {
                            if (Han.Ura_Dora == yaku.id)
                                uradora += yaku.val;
                            else if (Han.Red_Five == yaku.id)
                                akadora += yaku.val;
                            else if (Han.Dora == yaku.id)
                                dora += yaku.val;
                            else if (Han.Ippatsu == yaku.id)
                                ippatsu = true;
                        }
                        if (ippatsu)
                            stats[hule.seat].riichi.ippatsu++;
                        //turn counters
                        stats[hule.seat].turns.win += turn_counters[hule.seat];
                        if (!hule.zimo)
                            stats[lastDiscardSeat].turns.dealin += turn_counters[lastDiscardSeat];

                        const count_hand = function (ron_tsumo, counter, hule, active_riichis, uradora, akadora, dora, pts) {
                            if (hule.yiman)
                                counter.yakuman++;
                            counter.total++;
                            counter.uradora += uradora;
                            counter.akadora += akadora;
                            counter.dora    += dora;
                            counter.points  += pts;
                            if (active_riichis.has(hule.seat)) {
                                counter.riichi.total++;
                                counter.riichi.points += pts;
                            } else if ("ming" in hule) {
                                counter.open.total++;
                                counter.open.points += pts;
                            } else {
                                counter.dama.total++;
                                counter.dama.points += pts;
                            }
                            if (!ron_tsumo)
                                return;
                            if (hule.zimo) {
                                if (active_riichis.has(hule.seat))
                                    counter.riichi.tsumo++;
                                else if ("ming" in hule)
                                    counter.open.tsumo++;
                                else
                                    counter.dama.tsumo++;
                            } else {
                                if (active_riichis.has(hule.seat))
                                    counter.riichi.ron++;
                                else if ("ming" in hule)
                                    counter.open.ron++;
                                else
                                    counter.dama.ron++;
                            }

                            return;
                        }
                        //categorize win
                        if (uradora)
                            stats[hule.seat].riichi.ura_hit++;

                        count_hand(true, stats[hule.seat].wins, hule, active_riichis, uradora, akadora, dora, pts + 1000 * riichi_sticks);
                        if (!hule.zimo) {
                            count_hand(false, stats[lastDiscardSeat].dealins, hule, active_riichis, uradora, akadora, dora, pts);
                            if (active_riichis.has(lastDiscardSeat))
                                count_hand(false, stats[lastDiscardSeat].dealins_while_riichi, hule, active_riichis, uradora, akadora, dora, pts);
                            if (active_open_hands.has(lastDiscardSeat))
                                count_hand(false, stats[lastDiscardSeat].dealins_while_open, hule, active_riichis, uradora, akadora, dora, pts);
                        }
                        //categorize thit
                        if (hule.zimo && hule.seat != round.dealership) {
                            stats[round.dealership].dealer.tsumo_hit++;
                            stats[round.dealership].dealer.tsumo_hit_points += 100 * honba + hule.point_zimo_qin;
                            if (5 <= hule.count || (4 <= hule.count && 40 <= hule.fu) || (3 <= hule.count && 70 <= hule.fu)) {
                                stats[round.dealership].dealer.tsumo_hit_mangan++;
                                stats[round.dealership].dealer.tsumo_hit_mangan_points += 100 * honba + hule.point_zimo_qin;
                            }
                        }
                        //
                        honba         = 0; //first ron takes //TODO: check what mjs does http://arcturus.su/wiki/Multiple_ron
                        riichi_sticks = 0;
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
                        //round = null;
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
                    //round = null;
                    break;
                }
            }
		}

        if (!resp.data_url && !(resp.data && resp.data.length)) {
            console.log(`No data in response: ${id}`);
            return;
        }

		const players = resp.head.result.players.sort((a, b) => a.seat - b.seat);

		return {
			config: {
				aiLevel: resp.head.config.mode.detail_rule.ai_level
			},
			contestMajsoulId: resp.head.config ? resp.head.config.meta ? resp.head.config.meta.contest_uid : null : null,
			majsoulId: id,
			start_time: resp.head.start_time * 1000,
			end_time: resp.head.end_time * 1000,
			players: players.map(playerItem => {
				const account = resp.head.accounts.find(a => a.seat === playerItem.seat);
				if (!account) {
					return null;
				}
				return {
					nickname: account.nickname,
					majsoulId: account.account_id,
				}
			}),
			finalScore: players.map(playerItem => ({
				score: playerItem.part_point_1,
				uma: playerItem.total_point,
		    })),
			rounds: hands,
			stats: stats
		};
	}
    }

	public dispose() {
		this.connection.close();
	}

	private getAgariRecord(record: any, hule: any, round: RoundInfo): AgariInfo {
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
