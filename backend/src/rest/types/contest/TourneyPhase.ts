import { TourneyContestPhaseSubtype } from "../../../store/enums.js";
import { EliminationLevel } from "../EliminationLevel.js";
import { PlayerTourneyStandingInformation } from "../standings/PlayerTourneyStandingInformation.js";
import { TourneyContestScoringDetailsWithId } from "../standings/TourneyContestScoringDetailsWithId.js";
import { PhaseMetadata } from "./PhaseMetadata.js";

export interface TourneyPhase<Id = string> extends PhaseMetadata<Id> {
	scoringTypes?: TourneyContestScoringDetailsWithId[];
	standings?: PlayerTourneyStandingInformation[];
	subtype?: TourneyContestPhaseSubtype;
	eliminationLevels?: EliminationLevel[];
}
