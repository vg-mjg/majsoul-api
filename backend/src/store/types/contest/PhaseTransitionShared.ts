import { EliminationBracketSettings } from "./EliminationBracketSettings.js";

export interface PhaseTransitionShared {
	eliminationBracketSettings?: Record<number, EliminationBracketSettings>;
	eliminationBracketTargetPlayers?: number;
}
