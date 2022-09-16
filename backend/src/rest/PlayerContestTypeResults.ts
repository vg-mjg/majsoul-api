import { StyleGrade } from "../store/enums";
import { GachaData } from "./types/GachaData";

export interface PlayerContestTypeResults {
	playerId: string;
	rank: number;
	score: number;
	totalMatches: number;
	highlightedGameIds?: string[];
	gachaPulls?: GachaData[];
	styleGrade?: StyleGrade;
}
