import type { Store } from "backend";
import { Action, Dispatch } from "redux";
import { ActionType } from "../ActionType";

export interface ContestImagesFetchedAction extends Action<ActionType.ContestImagesFetched> {
	contest: Pick<Store.Contest, "_id"> & Pick<Store.Contest, "teams">;
}

export function dispatchContestImagesFetchedAction(
	dispatch: Dispatch<ContestImagesFetchedAction>,
	contest: Pick<Store.Contest, "_id"> & Pick<Store.Contest, "teams">
): void {
	dispatch({
		type: ActionType.ContestImagesFetched,
		contest
	});
}
