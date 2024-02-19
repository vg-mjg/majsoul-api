import { StatsVersion } from "../enums/StatsVersion";
import { AgariCategories } from "./first/AgariCategories";
import { AgariStats } from "./first/AgariStats";
import { CallStats } from "./first/CallStats";
import { DealerStats } from "./first/DealerStats";
import { DrawStats } from "./first/DrawStats";
import { RiichiStats } from "./first/RiichiStats";
import { SelfAgariStats } from "./first/SelfAgariStats";

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
