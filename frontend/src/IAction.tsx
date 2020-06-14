import { Action } from "redux";
import { ActionType } from "./ActionType";

export interface ISummaryRetrievedAction extends Action<ActionType.ContestSummaryRetrieved>{
	contest: any;
}

export interface ISessionGamesRetrieved extends Action<ActionType.SessionGamesRetrieved>{
	sessionId: string;
	games: any[];
}