import { StyleGrade } from "../store/types/enums/StyleGrade";

export function getStyleGrade(score: number): StyleGrade {
	if (score >= 400) {
		return StyleGrade.SSS;
	}
	if (score > 360) {
		return StyleGrade.SS;
	}
	if (score > 310) {
		return StyleGrade.S;
	}
	if (score > 250) {
		return StyleGrade.A;
	}
	if (score >= 180) {
		return StyleGrade.B;
	}
	if (score >= 100) {
		return StyleGrade.C;
	}
	return StyleGrade.D;
}
