import { StyleGrade } from "../enums/StyleGrade";
import { StyleMeterChange } from "./StyleMeterChange";


export interface StyleBreakdown {
	total: number;
	grade: StyleGrade;
	moves: StyleMeterChange[];
}
