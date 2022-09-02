import { Contest } from "./Contest.js";
import { ContestPhase } from "./ContestPhase.js";
import { ContestPhaseTransition } from "./ContestPhaseTransition.js";

export interface PhaseInfo<Id = any> {
	contest: Contest<Id>;
	transitions: ContestPhaseTransition<Id>[];
	phases: ContestPhase<Id>[];
}
