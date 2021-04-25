import { Action, Dispatch } from "redux";
import { Store } from "majsoul-api";
import { ActionType } from "./ActionType";

export interface ContestsIndexRetrievedAction extends Action<ActionType.ContestsIndexRetrieved> {
	contests: Store.Contest[];
}

export function dispatchContestsIndexRetrievedAction(dispatch: Dispatch<ContestsIndexRetrievedAction>, contests: Store.Contest[]): void {
	dispatch({
		type: ActionType.ContestsIndexRetrieved,
		contests
	});
}
