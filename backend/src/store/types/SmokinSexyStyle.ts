import { StyleBreakdown } from "../../connector/styleCalculator";

export interface SmokinSexyStyle<Id = any> {
	_id?: Id;
	gameId: Id;
	styles: {
		playerId: Id;
		styleBreakdown: StyleBreakdown;
	}[];
}
