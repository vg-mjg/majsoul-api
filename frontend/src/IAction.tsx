import { Action } from "redux";
import { ActionType } from "./ActionType";
export interface IAction extends Action<ActionType> {
	players?: [];
}
