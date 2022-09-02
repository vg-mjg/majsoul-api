import { StatsVersion } from "./StatsVersion.js";

export interface BaseStats {
	version: StatsVersion.None;
	stats: {
		gamesPlayed: number;
		totalHands: number;
		totalRank: number;
	}
}
