import { inspect } from 'util';
import { StatsVersion } from '../types/stats/StatsVersion';
import { Stats } from '../types/stats';
import { BaseStats } from '../types/stats/BaseStats';
import { createStats, FirstStats } from '../types/stats/FirstStats';

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
				stats: mergeFirstStats(stats as FirstStats[])
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

function mergeFirstStats(stats: FirstStats[]): FirstStats['stats'] {
	return stats.reduce((total, next) => {
		const totalChildren = [total];
		const nextChildren = [next.stats];
		while (totalChildren.length) {
			const totalChild = totalChildren.shift();
			const nextChild = nextChildren.shift();
			for (const key in totalChild) {
				if (isNaN(totalChild[key])) {
					totalChildren.push(totalChild[key]);
					nextChildren.push(nextChild[key]);
					continue;
				}
				// console.log(key, totalChildren[key], nextChild[key]);
				totalChild[key] += nextChild[key];
				// console.log(totalChildren[key]);
			}
		}
		return total;
	}, createStats());
}
