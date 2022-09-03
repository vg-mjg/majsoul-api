import { Store } from "backend";
import { Dispatch } from "react";
import { Action } from "redux";

import { ActionType } from "../ActionType";

export interface ContestSummaryRetrievedAction extends Action<ActionType.ContestSummaryRetrieved> {
	contest: Store.Contest<string>;
}

export function dispatchContestSummaryRetrievedAction(dispatch: Dispatch<ContestSummaryRetrievedAction>, contest: Store.Contest<string>) {
	dispatch({
		type: ActionType.ContestSummaryRetrieved,
		contest
	});
}
