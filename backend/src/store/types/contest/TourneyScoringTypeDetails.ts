import { TourneyContestScoringType } from "../enums/TourneyContestScoringType.js";
import { ConsecutiveScoringDetails } from "./ConsecutiveScoringDetails.js";

export interface TourneyScoringTypeDetails {
	type: TourneyContestScoringType;
	typeDetails?: ConsecutiveScoringDetails;
}
