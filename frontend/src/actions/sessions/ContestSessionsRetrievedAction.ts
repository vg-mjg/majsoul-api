import { Action, Dispatch } from "redux";
import { Rest } from "majsoul-api";
import { ActionType } from "../ActionType";

export interface ContestSessionsRetrievedAction extends Action<ActionType.ContestSessionsRetrieved> {
	contestId: string;
	phases: Rest.Phase[];
}

export function dispatchContestSessionsRetrievedAction(dispatch: Dispatch<ContestSessionsRetrievedAction>, contestId: string, phases: Rest.Phase[]): void {
	dispatch({
		contestId,
		type: ActionType.ContestSessionsRetrieved,
		phases
	});
}
