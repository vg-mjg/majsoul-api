import { StatsVersion } from "../enums/StatsVersion.js";
import { AgariCategories } from "./first/AgariCategories.js";
import { AgariStats } from "./first/AgariStats.js";
import { CallStats } from "./first/CallStats.js";
import { DealerStats } from "./first/DealerStats.js";
import { DrawStats } from "./first/DrawStats.js";
import { RiichiStats } from "./first/RiichiStats.js";
import { SelfAgariStats } from "./first/SelfAgariStats.js";

export interface FirstStats {
	version: StatsVersion.First;
	stats: {
		gamesPlayed: number;
		totalHands: number;
		totalHaipaiShanten: number;
		totalRank: number;

		uraDora: number;
		akaDora: number;

		riichi: RiichiStats;
		dealer: DealerStats;
		calls: CallStats;
		wins: SelfAgariStats;
		dealins: AgariCategories<AgariCategories<AgariStats>>;
		draws: DrawStats;
	}
}
