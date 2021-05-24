import { StatsVersion } from "./StatsVersion";

export interface BaseStats {
	version: StatsVersion.None;
	stats: {
		gamesPlayed: number;
		totalHands: number;
		averageRank: number;
	}
}
