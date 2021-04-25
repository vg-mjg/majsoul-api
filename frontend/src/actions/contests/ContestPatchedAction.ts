import { Action, Dispatch } from "redux";
import { Store } from "majsoul-api";
import { ActionType } from "./ActionType";

export interface ContestPatchedAction extends Action<ActionType.ContestPatched> {
	contest: Omit<Store.Contest, "teams" | "session">;
}

export function dispatchContestPatchedAction(dispatch: Dispatch<ContestPatchedAction>, contest: Omit<Store.Contest, "teams" | "session">) {
	dispatch({
		type: ActionType.ContestPatched,
		contest
	});
}
