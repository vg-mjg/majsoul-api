import { AgariInfo, RoundResult } from ".";
import { RoundInfo, DrawStatus, Han } from "..";
import { GameResult } from "../../store";
import { GameResultVersion } from "../../store/types/types";
import { GameRecordResponse, RecordNewRound, RecordDiscardTile, RecordChiPengGang, RecordDealTile, RecordAnGangAddGang, RecordNoTile, RecordHule } from "./GameRecordResponse";
import { PlayerGameStats, createStats } from "./Stats";
import * as syanten from "syanten";

const latestVersion = Object.values(GameResultVersion).length / 2 as GameResultVersion;

function handValue(hule: any, dealer_seat:number, honba: number, np: number): number {
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

const suitKeyMap: Record<string, number> = { m: 0, p: 1, s: 2, z: 3 };
function handShanten(hand: string[]): number {
	const hai: syanten.HaiArr = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0]
	];

	for (const t of hand) {
		let num: number  = parseInt(t[0]);
		if (0 === num) {
			num = 5;
		}

		hai[suitKeyMap[t[1]]][num - 1]++;
	};

	return syanten(hai);
}

function count_hand(ron_tsumo, counter, hule, active_riichis, uradora, akadora, dora, pts) {
	if (hule.yiman){
		counter.yakuman++;
	}

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

	if (!ron_tsumo) {
		return;
	}

	if (hule.zimo) {
		if (active_riichis.has(hule.seat)) {
			counter.riichi.tsumo++;
		} else if ("ming" in hule) {
			counter.open.tsumo++;
		} else {
			counter.dama.tsumo++;
		}
	} else {
		if (active_riichis.has(hule.seat)) {
			counter.riichi.ron++;
		} else if ("ming" in hule) {
			counter.open.ron++;
		} else {
			counter.dama.ron++;
		}
	}

	return;
}

function getAgariRecord(record: any, hule: any, round: RoundInfo): AgariInfo {
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

export function parseGameRecordResponse(game: GameRecordResponse): GameResult {
	if (!game.data_url && !(game.data && game.data.length)) {
		console.log(`No data in response`);
		return;
	}

	const np: number = 4;
	const hands: RoundResult[] = [];
	const stats: PlayerGameStats[] = [];
	let round: RoundInfo;
	let lastDiscardSeat: number;
	let leftover_riichi_sticks: number;
	let active_riichis = null;
	let kan_lock = null;
	let active_open_hands = null;
	let turn_counters = null;
	let repeat_series = 0;

	for (let p = 0; p < np; p++) {
		stats.push(createStats());
	}

	if (!game.data ||  game.data[0].constructor.name !== "RecordNewRound") {
		console.log("Game record does not start with RecordNewRound");
		return null;
	}

	for (let i = 0; i < game.data.length; i++) {
		const record = game.data[i];
		let record_next = (game.data.length <= i) ? game.data[i + 1] : null;
		switch (record.constructor.name) {
			case "RecordNewRound": {
				const recordNewRound = record as RecordNewRound;
				//repeat streaks
				if (round && round.dealership == recordNewRound.ju) {
					stats[round.dealership].dealer.repeats++;
					repeat_series++;
					if (repeat_series > stats[round.dealership].dealer.max_repeats) {
						stats[round.dealership].dealer.max_repeats = repeat_series;
					}
				} else {
					repeat_series = 0;
				}

				round = {
					round: recordNewRound.chang,
					dealership: recordNewRound.ju,
					repeat: recordNewRound.ben
				};
				//
				leftover_riichi_sticks = recordNewRound.liqibang;
				active_riichis     = new Set();
				kan_lock           = new Set();
				active_open_hands  = new Set();
				turn_counters      = new Array(np).fill(0);
				stats.forEach(p => p.nhands++);
				stats[round.dealership].turns.total++; //dealer's 'draw'
				stats[round.dealership].dealer.rounds++;
				turn_counters[round.dealership]++;
				for (let p = 0; p < np; p++) {
					stats[p].shanten += handShanten(recordNewRound['tiles' + p]);
				}
				break;
			}
			case "RecordDiscardTile": {
				const recordDiscardTile = record as RecordDiscardTile;
				lastDiscardSeat = recordDiscardTile.seat;

				//riichis
				if (recordDiscardTile.is_wliqi) {
					stats[recordDiscardTile.seat].riichi.daburiichi++;
				}

				if (recordDiscardTile.is_wliqi || recordDiscardTile.is_liqi) {
					stats[recordDiscardTile.seat].riichi.total++;
					stats[recordDiscardTile.seat].turns.riichi += turn_counters[recordDiscardTile.seat];
					//furiten
					if (recordDiscardTile.zhenting[recordDiscardTile.seat]) {
						stats[recordDiscardTile.seat].riichi.furiten++;
					}
					//chase
					if (active_riichis.size) {
						stats[recordDiscardTile.seat].riichi.chase++;
						active_riichis.forEach((p:number)  => stats[p].riichi.chased++);
					} else {
						stats[recordDiscardTile.seat].riichi.first++;
					}
					active_riichis.add(recordDiscardTile.seat);
					//check immediate deal-in
					if (record_next && "RecordHule" == record_next.constructor.name) {
						stats[recordDiscardTile.seat].riichi.immediate_dealin++;
					}
				}

				//calls
				if (game.data.length <= i) {
					console.log("Game record ends with Discard event");
					break;
				}

				if ("operations" in recordDiscardTile) { //somebody can call this discard
					//ignoring ron calls, get list of seats that can call
					const calloppsp = new Set<number>();
					recordDiscardTile.operations.filter(x => x.operation_list.find(op => op.type === 9) == null).forEach(x => calloppsp.add(x.seat));

					switch (record_next && record_next.constructor.name) {
						case "RecordHule": { //somebody ronned. nobody could call anyways
							break;
						} case "RecordChiPengGang": {
							const nextRecordChiPengGang = record_next as RecordChiPengGang;
							//somebody called
							if (0 ==  nextRecordChiPengGang.type) { //somebody chii'd. count all
								calloppsp.forEach((p) => {
									stats[p].calls.opps++;
									stats[p].calls.opps_all++;
								});
							} else { //pon, daiminkan. trumps chii
								stats[nextRecordChiPengGang.seat].calls.opps++;
								stats[nextRecordChiPengGang.seat].calls.opps_all++;
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
			} case "RecordDealTile": {
				const recordDealTile = record as RecordDealTile;
				turn_counters[recordDealTile.seat]++;
				stats[recordDealTile.seat].turns.total++;
				//shouminkan/ankan opportunity (types 4/6)
				if ("operation_list" in record) {
					const kans = recordDealTile.operation.operation_list.filter(e => (4 == e.type || 6 == e.type));
					for (const kan of kans) {
						stats[recordDealTile.seat].calls.opps_all++;
						if (!kan_lock.has(kan.combination[0])) {
							stats[recordDealTile.seat].calls.opps++;
							kan_lock.add(kan.combination[0]);
						}
					}
				}
				break;
			} case "RecordAnGangAddGang": {
				const recordAnGangAddGang = record as RecordAnGangAddGang;
				stats[recordAnGangAddGang.seat].calls.total++;
				break;
			} case "RecordChiPengGang": {
				const recordChiPengGang = record as RecordChiPengGang;
				stats[recordChiPengGang.seat].turns.total++;
				turn_counters[recordChiPengGang.seat]++;
				stats[recordChiPengGang.seat].calls.total++;
				if (!active_open_hands.has(recordChiPengGang.seat)) {
					stats[recordChiPengGang.seat].calls.opened_hands++;
					active_open_hands.add(recordChiPengGang.seat);
				}
				break;
			} case "RecordLiuJu": {
				lastDiscardSeat = null;
				break;
			} case "RecordNoTile": {
				const recordNoTile = record as RecordNoTile;
				if (!round) {
					console.log("Missing hand for NoTile event");
					continue;
				}

				active_riichis.forEach((p: number) => stats[p].draws.riichi++);
				active_open_hands.forEach((p: number) => stats[p].draws.open++);
				for (const p in recordNoTile.players) {
					stats[p].draws.total++;
					if (recordNoTile.players[p].tingpai) {
						stats[p].draws.ten++;
					}
				}

				for (const scores of recordNoTile.scores) {
					if ("delta_scores" in scores) {
						for (const p in scores.delta_scores) {
							stats[p].draws.points += scores.delta_scores[p];
							if (recordNoTile.liujumanguan && 0 < scores.delta_scores[p]) {
								stats[p].draws.nagashi++;
							}
						}
					};
				}

				hands.push({
					round,
					draw: {
						playerDrawStatus: (recordNoTile.players as any[]).map((player, index) => {
							if (recordNoTile.liujumanguan && (recordNoTile.scores as any[]).find(score => score.seat === index)) {
								return DrawStatus.Nagashi_Mangan;
							}
							return player.tingpai ? DrawStatus.Tenpai : DrawStatus.Noten;
						})
					}
				});
				lastDiscardSeat = null;
				//round = null;
				break;
			} case "RecordHule": {
				const recordHule = record as RecordHule;
				if (!round) {
					console.log("Missing hand for Hule event");
					continue;
				}

				//sticks
				let riichi_sticks = active_riichis.size + leftover_riichi_sticks;
				if (active_riichis.has(recordHule.hules[0].seat)) {
					stats[recordHule.hules[0].seat].riichi.sticks_kept++;
				}
				stats[recordHule.hules[0].seat].riichi.sticks_won += riichi_sticks;
				//categorize win
				let honba = round.repeat;
				for (const hule of recordHule.hules) {
					//general
					let pts     = handValue(hule, round.dealership, honba, np);
					let uradora = 0;
					let akadora = 0;
					let dora    = 0;
					let ippatsu = false;

					for (const yaku of hule.fans) {
						if (Han.Ura_Dora == yaku.id){
							uradora += yaku.val;
						} else if (Han.Red_Five == yaku.id) {
							akadora += yaku.val;
						} else if (Han.Dora == yaku.id) {
							dora += yaku.val;
						} else if (Han.Ippatsu == yaku.id) {
							ippatsu = true;
						}
					}

					if (ippatsu) {
						stats[hule.seat].riichi.ippatsu++;
					}

					//turn counters
					stats[hule.seat].turns.win += turn_counters[hule.seat];
					if (!hule.zimo) {
						stats[lastDiscardSeat].turns.dealin += turn_counters[lastDiscardSeat];
					}
					//categorize win
					if (uradora) {
						stats[hule.seat].riichi.ura_hit++;
					}

					count_hand(true, stats[hule.seat].wins, hule, active_riichis, uradora, akadora, dora, pts + 1000 * riichi_sticks);
					if (!hule.zimo) {
						count_hand(false, stats[lastDiscardSeat].dealins, hule, active_riichis, uradora, akadora, dora, pts);
						if (active_riichis.has(lastDiscardSeat)) {
							count_hand(false, stats[lastDiscardSeat].dealins_while_riichi, hule, active_riichis, uradora, akadora, dora, pts);
						}
						if (active_open_hands.has(lastDiscardSeat)) {
							count_hand(false, stats[lastDiscardSeat].dealins_while_open, hule, active_riichis, uradora, akadora, dora, pts);
						}
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
				if (recordHule.hules[0].zimo) {
					const hule = recordHule.hules[0];
					hands.push({
						round,
						tsumo: {
							...getAgariRecord(record, hule, round),
							dealerValue: hule.point_zimo_qin,
						}
					});
					//round = null;
					break;
				}
				hands.push({
					round,
					rons: (recordHule.hules as any[]).map(hule => {
						return {
							...getAgariRecord(record, hule, round),
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

	const players = game.head.result.players.sort((a, b) => a.seat - b.seat);

	return {
		_id: null,
		contestId: null,
		version: latestVersion,
		config: {
			aiLevel: game.head.config.mode.detail_rule.ai_level
		},
		contestMajsoulId: game.head.config ? game.head.config.meta ? game.head.config.meta.contest_uid : null : null,
		majsoulId: game.head.uuid,
		start_time: game.head.start_time * 1000,
		end_time: game.head.end_time * 1000,
		players: players.map(playerItem => {
			const account = game.head.accounts.find(a => a.seat === playerItem.seat);
			if (!account) {
				return null;
			}
			return {
				_id: null,
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
