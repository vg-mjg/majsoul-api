import { TourneyContestScoringType } from "../enums/TourneyContestScoringType";
import { ConsecutiveScoringDetails } from "./ConsecutiveScoringDetails";

export interface TourneyScoringTypeDetails {
	type: TourneyContestScoringType;
	typeDetails?: ConsecutiveScoringDetails;
}
