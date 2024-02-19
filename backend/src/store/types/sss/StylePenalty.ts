import { StyleMeterChangeType } from "../enums/StyleMeterChangeType";
import { StylePenaltyType } from "../enums/StylePenaltyType";


export interface StylePenalty {
	type: StyleMeterChangeType.Penalty;
	penaltyType: StylePenaltyType;
	points: number;
}
