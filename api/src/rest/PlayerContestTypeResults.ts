import { GachaData } from "./types/types.js";


export interface PlayerContestTypeResults {
	playerId: string;
	rank: number;
	score: number;
	totalMatches: number;
	highlightedGameIds?: string[];
	gachaPulls?: GachaData[];
}
