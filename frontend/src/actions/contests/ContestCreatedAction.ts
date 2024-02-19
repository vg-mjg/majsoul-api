
import type { Store } from "backend";
import { Action, Dispatch } from "redux";

import { ActionType } from "../ActionType";

export interface ContestCreatedAction extends Action<ActionType.ContestCreated> {
	contest: Pick<Store.Contest, "_id">
}

export function  dispatchContestCreatedAction(
	dispatch: Dispatch<ContestCreatedAction>,
	contest: Pick<Store.Contest, "_id">
): void {
	dispatch({
		type: ActionType.ContestCreated,
		contest
	});
}
