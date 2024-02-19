import { Action, Dispatch } from "redux";

import { ActionType } from "../ActionType";

export type LogOutAction = Action<ActionType.LoggedOut>

export function dispatchLoggedOutAction(dispatch: Dispatch<LogOutAction>) {
	dispatch({ type: ActionType.LoggedOut });
}
