import { DrawStatus, GameResult } from "../../store";
import { AgariInfo, GameResultVersion, HandStatus, PlayerStats, RoundInfo, RoundResult } from "../../store/types/types";
import { GameRecordResponse, RecordNewRound, RecordDiscardTile, RecordChiPengGang, RecordDealTile, RecordAnGangAddGang, RecordNoTile, RecordHule, HuleInfo } from "./GameRecordResponse";
import * as syanten from "syanten";
import { Han } from ".";

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

function getAgariRecord(record: any, hule: HuleInfo, round: RoundInfo): AgariInfo {
	const value = hule.zimo
		? (hule.seat === round.dealership
			? hule.point_zimo_xian * 3
			: hule.point_zimo_qin + hule.point_zimo_xian * 2)
		: hule.point_rong - (hule.liqi ? 1000 : 0);
	return {
		extras: record.delta_scores[hule.seat] - value - (hule.liqi ? 1000 : 0),
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
	if (!game?.data_url && !(game?.data && game?.data?.length)) {
		console.log(`No data in response`);
		return null;
	}

	// TODO: take this from game metadata
	const numberOfPlayers: number = 4;
	const rounds: RoundResult[] = [];

	let round: RoundInfo;
	let losingSeat: number;
	let kan_lock = null;
	let playerStats: PlayerStats[];

	if (!game.data || game.data[0].constructor.name !== "RecordNewRound") {
		console.log("Game record does not start with RecordNewRound");
		return null;
	}

	for (let i = 0; i < game.data.length; i++) {
		const record = game.data[i];
		switch (record.constructor.name) {
			case "RecordNewRound": {
				const recordNewRound = record as RecordNewRound;

				round = {
					round: recordNewRound.chang,
					dealership: recordNewRound.ju,
					repeat: recordNewRound.ben
				};

				kan_lock = new Set();

				losingSeat = null;
				playerStats = [];
				for (let p = 0; p < numberOfPlayers; p++) {
					playerStats[p] = {
						haipaiShanten: handShanten(recordNewRound['tiles' + p]),
						calls: {
							total: 0,
							repeatOpportunities: 0,
							opportunities: 0,
						},
						finalHandState: {
							status: HandStatus.Closed
						}
					};
				}
				break;
			}
			case "RecordDiscardTile": {
				const recordDiscardTile = record as RecordDiscardTile;
				losingSeat = recordDiscardTile.seat;

				if (recordDiscardTile.is_wliqi || recordDiscardTile.is_liqi) {
					playerStats[recordDiscardTile.seat].finalHandState = {
						status: HandStatus.Riichi,
						index: playerStats.filter(player => player.finalHandState.status === HandStatus.Riichi).length,
						furiten: recordDiscardTile.zhenting[recordDiscardTile.seat]
					}
				}

				//calls
				if (game.data.length <= i) {
					console.log("Game record ends with Discard event");
					break;
				}

				if (!recordDiscardTile.operations) {
					break;
				}

				const recordNext = game.data[i + 1];
				if (!recordNext) {
					break;
				}

				if (recordNext.constructor.name === "RecordHule") {
					//somebody ronned. nobody could call anyways
					break;
				}

				if (recordNext.constructor.name === "RecordChiPengGang") {
					const nextRecordChiPengGang = recordNext as RecordChiPengGang;
					//somebody called
					if (nextRecordChiPengGang.type !== 0) {//somebody chii'd. count all
						playerStats[nextRecordChiPengGang.seat].calls.opportunities++;
						break;
					}
				}

				//ignoring ron calls, get list of seats that can call
				const callOpportunities = recordDiscardTile.operations
					.filter(x => x.operation_list.find(op => op.type !== 9) != null)
					.reduce((total, next) => (total.add(next.seat), total), new Set<number>());

				for (const player of callOpportunities) {
					playerStats[player].calls.opportunities++;
				};

				break;
			} case "RecordDealTile": {
				const recordDealTile = record as RecordDealTile;
				//shouminkan/ankan opportunity (types 4/6)
				if (!recordDealTile.operation?.operation_list) {
					break;
				}

				const kans = recordDealTile.operation.operation_list.filter(e => (4 == e.type || 6 == e.type));
				for (const kan of kans) {
					playerStats[recordDealTile.seat].calls.opportunities++;
					console.log(kan.combination);
					if (!kan_lock.has(kan.combination[0])) {
						playerStats[recordDealTile.seat].calls.repeatOpportunities++;
						kan_lock.add(kan.combination[0]);
					}
				}
				break;
			} case "RecordAnGangAddGang": {
				const recordAnGangAddGang = record as RecordAnGangAddGang;
				playerStats[recordAnGangAddGang.seat].calls.total++;
				losingSeat = recordAnGangAddGang.seat;
				break;
			} case "RecordChiPengGang": {
				const recordChiPengGang = record as RecordChiPengGang;
				playerStats[recordChiPengGang.seat].calls.total++;
				if (playerStats[recordChiPengGang.seat].finalHandState.status === HandStatus.Open) {
					break;
				}

				playerStats[recordChiPengGang.seat].finalHandState = {
					status: HandStatus.Open
				}
				break;
			} case "RecordNoTile": {
				const recordNoTile = record as RecordNoTile;

				rounds.push({
					round,
					draw: {
						playerDrawStatus: (recordNoTile.players as any[]).map((player, index) => {
							if (recordNoTile.liujumanguan && (recordNoTile.scores as any[]).find(score => score.seat === index)) {
								return DrawStatus.Nagashi_Mangan;
							}
							return player.tingpai ? DrawStatus.Tenpai : DrawStatus.Noten;
						})
					},
					playerStats
				});
				break;
			} case "RecordHule": {
				const recordHule = record as RecordHule;

				if (recordHule.hules[0].zimo) {
					const hule = recordHule.hules[0];
					rounds.push({
						round,
						tsumo: {
							...getAgariRecord(record, hule, round),
							dealerValue: hule.point_zimo_qin,
						},
						playerStats
					});
					break;
				}

				rounds.push({
					round,
					rons: (recordHule.hules).map(hule => {
						return {
							...getAgariRecord(record, hule, round),
							loser: losingSeat
						};
					}),
					playerStats
				});
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
		rounds,
	};
}
