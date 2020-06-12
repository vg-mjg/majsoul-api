import { Action } from "redux";
import { ActionType } from "./ActionType";
import { ITeam } from "./IState";
export interface IAction extends Action<ActionType> {
	players?: [];
}

export interface ISummaryRetrievedAction extends Action<ActionType.SummaryRetrieved>{
	summary: any;
}

export interface ITeamsRetrievedAction extends Action<ActionType.TeamsRetrieved>{
	teams: ITeam[];
}
