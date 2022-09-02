import { TourneyScoringTypeDetails } from "./TourneyScoringTypeDetails.js";

export type TourneyScoringInfoPart = TourneyScoringTypeDetails & {
	places?: number;
	suborder?: TourneyScoringInfoPart[];
	reverse?: boolean;
};
