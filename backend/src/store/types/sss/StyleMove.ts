import { StyleMeterChangeType } from "../enums/StyleMeterChangeType";
import { StyleMoveType } from "../enums/StyleMoveType";


export interface StyleMove {
	type: StyleMeterChangeType.Move;
	moveType: StyleMoveType;
	rawPoints: number;
	repetitionReduction: number;
	multiplier: number;
	actualPoints: number;
}
