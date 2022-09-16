import { StyleBreakdown } from "../store/types/sss/StyleBreakdown";
import { GachaData } from "./types/GachaData";

export interface PlayerContestTypeResults {
	playerId: string;
	rank: number;
	score: number;
	totalMatches: number;
	highlightedGameIds?: string[];
	gachaPulls?: GachaData[];
}
