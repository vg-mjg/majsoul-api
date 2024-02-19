import { Contest } from "./Contest";
import { ContestPhase } from "./ContestPhase";
import { ContestPhaseTransition } from "./ContestPhaseTransition";

export interface PhaseInfo<Id = any> {
	contest: Contest<Id>;
	transitions: ContestPhaseTransition<Id>[];
	phases: ContestPhase<Id>[];
}
