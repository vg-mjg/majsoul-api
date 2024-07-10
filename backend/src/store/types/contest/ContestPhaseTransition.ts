import { PhaseTransitionShared } from "./PhaseTransitionShared";
import { TourneyContestScoringInfo } from "./TourneyContestScoringInfo";

export interface ContestPhaseTransition<Id = string> extends PhaseTransitionShared {
	name?: string;
	_id: Id;
	startTime: number;
	teams?: {
		top?: number;
	};
	score?: {
		half?: true;
		nil?: true;
	};
	showJointGraph?: boolean;
	scoringTypes?: TourneyContestScoringInfo;
}
