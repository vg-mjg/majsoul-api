import { Action } from "redux";
import { Store } from "backend";
import { ActionType } from "../ActionType";
import { Dispatch } from "react";

export interface ContestSummaryRetrievedAction extends Action<ActionType.ContestSummaryRetrieved> {
	contest: Store.Contest<string>;
}

export function dispatchContestSummaryRetrievedAction(dispatch: Dispatch<ContestSummaryRetrievedAction>, contest: Store.Contest<string>) {
	dispatch({
		type: ActionType.ContestSummaryRetrieved,
		contest
	});
}
