import { StyleGrade } from "../store/types/enums/StyleGrade";

export function getStyleGrade(score: number): StyleGrade {
	if (score >= 400) {
		return StyleGrade.SSS;
	}
	if (score > 350) {
		return StyleGrade.SS;
	}
	if (score > 300) {
		return StyleGrade.S;
	}
	if (score > 200) {
		return StyleGrade.A;
	}
	if (score >= 120) {
		return StyleGrade.B;
	}
	if (score >= 60) {
		return StyleGrade.C;
	}
	return StyleGrade.D;
}
