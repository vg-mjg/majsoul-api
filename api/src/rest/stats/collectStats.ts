import { ObjectId } from 'mongodb';
import { Store } from '../..';
import { StatsVersion } from '../types/stats/StatsVersion';
import { Stats } from '../types/stats';
import { BaseStats } from '../types/stats/BaseStats';
import { createStats, FirstStats } from '../types/stats/FirstStats';
import { Han } from '../../majsoul';
import { HandStatus } from '../../store';

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

function collectFirstStats(
	game: Store.GameResult<ObjectId>,
	player: PlayerData,
	baseStats: BaseStats['stats'],
): FirstStats['stats'] {
	return {
		...game.rounds.reduce((total, round) => {
			const stats = round.playerStats[player.seat];
			total.totalHaipaiShanten += stats.haipaiShanten;

			const agari = [...(round.rons ?? []), round.tsumo]?.find(ron => ron?.winner === player.seat);
			if (agari) {
				total.akaDora += agari.han.filter(han => han === Han.Dora).length;
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

					if (agari) {
						const uraDora = agari.han.filter(han => han === Han.Ura_Dora).length;
						total.uraDora += uraDora;
						total.riichi.uraHit++;
						if (agari.han.find(han => han === Han.Ippatsu)) {
							total.riichi.ippatsu++;
						}
					}

					break;
				}
			}

			return total;
		}, createStats()),
		...baseStats,
	};
}


