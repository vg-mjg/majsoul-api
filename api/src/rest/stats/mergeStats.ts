import { StatsVersion } from '../types/stats/StatsVersion';
import { Stats } from '../types/stats';
import { BaseStats } from '../types/stats/BaseStats';

export function mergeStats(stats: Stats[], version: StatsVersion): Stats {
	switch (version) {
		case StatsVersion.Undefined: {
			return null;
		} case StatsVersion.None: {
			const gamesPlayed = stats.reduce((total, next) => total + next.stats.gamesPlayed, 0);
			return {
				version: StatsVersion.None,
				stats: {
					averageRank: stats.reduce((total, next) => total + next.stats.averageRank * next.stats.gamesPlayed, 0) / gamesPlayed,
					gamesPlayed,
					totalHands: stats.reduce((total, next) => total + next.stats.totalHands, 0),
				}
			} as BaseStats;
		}
	}
	return null;
}
