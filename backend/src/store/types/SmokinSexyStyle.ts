import { StyleBreakdown } from "./sss/StyleBreakdown";

export interface SmokinSexyStyle<Id = any> {
	_id?: Id;
	gameId: Id;
	styles: StyleBreakdown[];
}
