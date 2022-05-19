import { StatsVersion } from '../types/stats/StatsVersion';
import { Stats } from '../types/stats';
import { BaseStats } from '../types/stats/BaseStats';
import { createStats, FirstStats } from '../types/stats/FirstStats';
import { createKhanStats, KhanStats } from '../types/stats/KhanStats';

export function mergeStats(stats: Stats[], version: StatsVersion): Stats {
	switch (version) {
		case StatsVersion.Undefined: {
			return null;
		} case StatsVersion.None: {
			return {
				version: StatsVersion.None,
				stats: mergeBaseStats(stats as BaseStats[])
			};
		} case StatsVersion.First: {
			return {
				version: StatsVersion.First,
				stats: mergeAllStats(stats as FirstStats[], createStats)
			};
		} case StatsVersion.Khan: {
			return {
				version: StatsVersion.Khan,
				stats: mergeAllStats(stats as KhanStats[], createKhanStats)
			};
		}
	}
	return null;
}

function mergeBaseStats(stats: BaseStats[]): BaseStats['stats'] {
	return stats.reduce((total, next) => {
		total.gamesPlayed += next.stats.gamesPlayed;
		total.totalHands += next.stats.totalHands;
		total.totalRank += next.stats.totalRank;
		return total;
	}, {
		gamesPlayed: 0,
		totalHands: 0,
		totalRank: 0
	});
}

function mergeAllStats<T extends Stats>(stats: T[], createStats: () => T['stats']): T['stats'] {
	return stats.reduce((total, next) => {
		const totalChildren = [total] as any;
		const nextChildren = [next.stats];
		while (totalChildren.length) {
			const totalChild = totalChildren.shift();
			const nextChild = nextChildren.shift();
			for (const key in totalChild) {
				if (nextChild[key] === undefined) {
					continue;
				}

				if (isNaN(totalChild[key])) {
					totalChildren.push(totalChild[key]);
					nextChildren.push(nextChild[key]);
					continue;
				}

				totalChild[key] += (nextChild[key] ?? 0);
			}
		}
		return total;
	}, createStats());
}
