import { EliminationBracketSettings } from "./EliminationBracketSettings";

export interface PhaseTransitionShared {
	eliminationBracketSettings?: Record<number, EliminationBracketSettings>;
	eliminationBracketTargetPlayers?: number;
	showJointGraph?: boolean;
}
