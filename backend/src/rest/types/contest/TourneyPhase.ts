import { TourneyContestPhaseSubtype } from "../../../store/enums";
import { EliminationLevel } from "../EliminationLevel";
import { PlayerTourneyStandingInformation } from "../standings/PlayerTourneyStandingInformation";
import { TourneyContestScoringDetailsWithId } from "../standings/TourneyContestScoringDetailsWithId";
import { TourneyPhaseTeamTotalScore } from "../standings/TourneyPhaseTeamTotalScore";
import { PhaseMetadata } from "./PhaseMetadata";

export interface TourneyPhase<Id = string> extends PhaseMetadata<Id> {
	scoringTypes?: TourneyContestScoringDetailsWithId[]
	standings?: PlayerTourneyStandingInformation[]
	teamTotals?: TourneyPhaseTeamTotalScore[]
	subtype?: TourneyContestPhaseSubtype
	eliminationLevels?: EliminationLevel[]
}
