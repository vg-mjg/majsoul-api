import { GachaData } from './types/types';


export interface PlayerContestTypeResults {
	playerId: string;
	rank: number;
	score: number;
	totalMatches: number;
	highlightedGameIds?: string[];
	gachaPulls?: GachaData[];
}
