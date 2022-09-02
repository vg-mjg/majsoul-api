import { ContestType } from "../enums/ContestType.js";
import { TourneyContestPhaseSubtype } from "../enums/TourneyContestPhaseSubtype.js";
import { PhaseTransitionShared } from "./PhaseTransitionShared.js";
import { TourneyContestScoringInfo } from "./TourneyContestScoringInfo.js";

export interface TourneyContestPhase extends PhaseTransitionShared {
	type?: ContestType.Tourney;
	subtype?: TourneyContestPhaseSubtype;
	tourneyType?: TourneyContestScoringInfo;
	maxGames?: number;
	bonusPerGame?: number;
}
