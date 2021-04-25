
import { Action, Dispatch } from "redux";
import { Contest } from "src/State";
import { ActionType } from "../ActionType";

export interface ContestCreatedAction extends Action<ActionType.ContestCreated> {
	contest: Pick<Contest, "_id">
}

export function  dispatchContestCreatedAction(
	dispatch: Dispatch<ContestCreatedAction>,
	contest: Pick<Contest, "_id">
): void {
	dispatch({
		type: ActionType.ContestCreated,
		contest
	});
}
