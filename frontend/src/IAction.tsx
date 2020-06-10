import { Action } from "redux";
import { ActionType } from "./ActionType";
export interface IAction extends Action<ActionType> {
	players?: [];
}

export interface ISummaryRetrievedAction extends Action<ActionType.SummaryRetrieved>{
	summary: any;
}
