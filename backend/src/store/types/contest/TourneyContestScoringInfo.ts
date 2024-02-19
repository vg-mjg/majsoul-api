import { TourneyContestScoringType } from "../enums/TourneyContestScoringType";
import { TourneyScoringInfoPart } from "./TourneyScoringInfoPart";

export type TourneyContestScoringInfo = TourneyContestScoringType | TourneyScoringInfoPart[];
