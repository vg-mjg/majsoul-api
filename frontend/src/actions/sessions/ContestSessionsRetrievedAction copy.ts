import { Action, Dispatch } from "redux";
import { Store } from "majsoul-api";
import { ActionType } from "../ActionType";

export interface SessionPatchedAction extends Action<ActionType.SessionPatched> {
	session: Store.Session;
}

export function  dispatchSessionPatchedAction(dispatch: Dispatch<SessionPatchedAction>, session: Store.Session): void {
	dispatch({
		type: ActionType.SessionPatched,
		session
	});
}
