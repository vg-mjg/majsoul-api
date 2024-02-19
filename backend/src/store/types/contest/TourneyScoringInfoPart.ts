import { TourneyScoringTypeDetails } from "./TourneyScoringTypeDetails";

export type TourneyScoringInfoPart = TourneyScoringTypeDetails & {
	places?: number;
	suborder?: TourneyScoringInfoPart[];
	reverse?: boolean;
};
