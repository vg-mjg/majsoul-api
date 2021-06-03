import { ObjectId } from 'mongodb';
import { Store } from '../..';
import { StatsVersion } from '../types/stats/StatsVersion';
import { Stats } from '../types/stats';
import { BaseStats } from '../types/stats/BaseStats';
import { AgariCategories, createStats, FirstStats } from '../types/stats/FirstStats';
import { Han } from '../../majsoul';
import { DrawStatus, HandStatus } from '../../store';

interface PlayerData {
	playerId: ObjectId;
	teamId?: ObjectId;
	seat: number;
}

export interface GamePlayerIds {
	playerId: ObjectId,
	teamId?: ObjectId,
}

export function collectStats(
	game: Store.GameResult<ObjectId>,
	version: StatsVersion,
	players?: Record<string, ObjectId | boolean>): (Stats & GamePlayerIds)[] {
	const baseStatsData = generateBaseStatsData(game);
	switch (version) {
		case StatsVersion.Undefined: {
			return null;
		} case StatsVersion.None: {
			return selectPlayers(game, players).map(player => {
				return {
					version: StatsVersion.None,
					...player,
					stats: collectBaseStats(game, player, baseStatsData)
				};
			});
		} case StatsVersion.First: {
			return selectPlayers(game, players).map(player => {
				return {
					version: StatsVersion.First,
					...player,
					stats: collectFirstStats(
						game,
						player,
						collectBaseStats(game, player, baseStatsData)
					)
				};
			});
		}
	}
}

function selectPlayers(game: Store.GameResult<ObjectId>, players?: Record<string, boolean | ObjectId>): PlayerData[] {
	return game.players
		.map((player, seat) => ({
			playerId: player._id,
			teamId: (players == null || players[player._id.toHexString()] === true) ? undefined : players[player._id.toHexString()] as ObjectId,
			seat
		}))
		.filter(player => players == null || !!players[player.playerId.toHexString()]);
}

interface BaseStatsSharedData {
	standings: number[];
}

function generateBaseStatsData(game: Store.GameResult<ObjectId>): BaseStatsSharedData {
	return {
		standings: game.finalScore
			.map((score, seat) => ({ ...score, seat }))
			.sort((a, b) => b.score - a.score)
			.reduce((total, next, rank) => (total[next.seat] = rank + 1, total), [] as number[])
	}
}

function collectBaseStats(game: Store.GameResult<ObjectId>, player: PlayerData, data: BaseStatsSharedData): BaseStats['stats'] {
	return {
		gamesPlayed: 1,
		totalHands: game.rounds.length,
		totalRank: data.standings[player.seat]
	};
}

function selectCategory<T>(handStatus: HandStatus, agariStats: AgariCategories<T>): T {
	return handStatus === HandStatus.Open
		? agariStats.open
		: handStatus === HandStatus.Closed
			? agariStats.dama
			: agariStats.riichi;
}

function collectFirstStats(
	game: Store.GameResult<ObjectId>,
	player: PlayerData,
	baseStats: BaseStats['stats'],
): FirstStats['stats'] {
	return {
		...game.rounds.reduce((total, round) => {
			const stats = round.playerStats[player.seat];
			total.totalHaipaiShanten += stats.haipaiShanten;

			total.calls.total += stats.calls.total;
			total.calls.opportunities += stats.calls.opportunities;
			total.calls.repeatOpportunities += stats.calls.repeatOpportunities;

			const win = [...(round.rons ?? []), round.tsumo]?.find(ron => ron?.winner === player.seat);

			if (win) {
				total.akaDora += win.han.filter(han => han === Han.Dora).length;
				if (round.tsumo) {
					total.wins.tsumo++;
				}

				const category = selectCategory(stats.finalHandState.status, total.wins);
				category.total++;
				category.points += win.value;
			} else if (round.draw) {
				total.draws.total++;
				if (round.draw.playerDrawStatus[player.seat] === DrawStatus.Tenpai) {
					total.draws.tenpai++;
				}
			} else if (round.tsumo && round.round.dealership === player.seat) {
				total.dealer.tsumoHit++;
				total.dealer.tsumoHitPoints += round.tsumo.dealerValue;
				if (round.tsumo.dealerValue > 4000) {
					total.dealer.tsumoHitMangan++;
				}
			} else if (round.rons?.[0]?.loser === player.seat) {
				const dealinCategory = selectCategory(stats.finalHandState.status, total.dealins);
				for (const loss of round.rons) {
					const opponentCategory = selectCategory(round.playerStats[loss.winner].finalHandState.status, dealinCategory);
					opponentCategory.total++;
					opponentCategory.points += loss.value;
				}
			}

			switch (stats.finalHandState.status) {
				case HandStatus.Riichi: {
					total.riichi.total++;

					if (stats.finalHandState.furiten) {
						total.riichi.furiten++;
					}

					const index = stats.finalHandState.index;

					if (index === 0) {
						total.riichi.first++;
					} else {
						total.riichi.chase++;
					}

					if (round.playerStats.find(otherStats =>
						otherStats.finalHandState.status === HandStatus.Riichi
						&& otherStats.finalHandState.index > index
					)) {
						total.riichi.chased++;
					}

					if (win) {
						const uraDora = win.han.filter(han => han === Han.Ura_Dora).length;
						total.uraDora += uraDora;
						if (uraDora > 0) {
							total.riichi.uraHit++;
						}
						if (win.han.find(han => han === Han.Ippatsu)) {
							total.riichi.ippatsu++;
						}
					} else if (round.draw) {
						total.draws.riichi++;
					}

					break;
				} case HandStatus.Open: {
					total.calls.openedHands++;

					if (round.draw) {
						total.draws.open++;
					}
					break;
				}
			}

			return total;
		}, createStats()),
		...baseStats,
	};
}


