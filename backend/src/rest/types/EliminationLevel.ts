import { EliminationMatchDetails } from "./EliminationMatchDetails.js";

export interface EliminationLevel {
	levelNumber: number;
	gamesPerMatch: number;
	completedMatches: EliminationMatchDetails[];
	requiredMatches: number;
	winnersPerMatch: number;
}
