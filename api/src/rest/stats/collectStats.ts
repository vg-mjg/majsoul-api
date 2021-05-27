import { ObjectId } from 'mongodb';
import { Store } from '../..';
import { StatsVersion } from '../types/stats/StatsVersion';
import { Stats } from '../types/stats';
import { BaseStats } from '../types/stats/BaseStats';

export interface GamePlayerIds {
	playerId: ObjectId,
	teamId: ObjectId,
}

export function collectStats(
	game: Store.GameResult<ObjectId>,
	version: StatsVersion,
	players?: Record<string, ObjectId | boolean>): (Stats & GamePlayerIds)[] {
	switch (version) {
		case StatsVersion.Undefined: {
			return null;
		} case StatsVersion.None: {
			const standings = game.finalScore
				.map((score, index) => ({ ...score, playerId: game.players[index]._id }))
				.sort((a, b) => b.score - a.score)
				.reduce((total, next, index) => (total[next.playerId.toHexString()] = index + 1, total), {} as Record<string, number>);
			return game.players.filter(player => players == null || players[player._id.toHexString()] != null)
				.map((player) => (
					{
						playerId: player._id,
						teamId: players?.[player._id.toHexString()],
						version: StatsVersion.None,
						stats: {
							gamesPlayed: 1,
							totalHands: game.rounds.length,
							averageRank: standings[player._id.toHexString()]
						}
					} as BaseStats & GamePlayerIds
				));
		}
	}
	return null;
}
