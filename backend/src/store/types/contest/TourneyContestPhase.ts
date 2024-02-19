import { ContestType } from "../enums/ContestType";
import { TourneyContestPhaseSubtype } from "../enums/TourneyContestPhaseSubtype";
import { PhaseTransitionShared } from "./PhaseTransitionShared";
import { TourneyContestScoringInfo } from "./TourneyContestScoringInfo";

export interface TourneyContestPhase extends PhaseTransitionShared {
	type?: ContestType.Tourney;
	subtype?: TourneyContestPhaseSubtype;
	tourneyType?: TourneyContestScoringInfo;
	maxGames?: number;
	bonusPerGame?: number;
}
