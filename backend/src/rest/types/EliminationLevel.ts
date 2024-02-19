import { EliminationMatchDetails } from "./EliminationMatchDetails";

export interface EliminationLevel {
	levelNumber: number;
	gamesPerMatch: number;
	completedMatches: EliminationMatchDetails[];
	requiredMatches: number;
	winnersPerMatch: number;
}
