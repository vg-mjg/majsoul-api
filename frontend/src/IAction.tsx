import { Action } from "redux";
import { ActionType } from "./ActionType";

export interface ISummaryRetrievedAction extends Action<ActionType.SummaryRetrieved>{
	contest: any;
}
