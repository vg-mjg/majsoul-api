import { TourneyContestScoringType } from "../enums/TourneyContestScoringType.js";
import { TourneyScoringInfoPart } from "./TourneyScoringInfoPart.js";

export type TourneyContestScoringInfo = TourneyContestScoringType | TourneyScoringInfoPart[];
