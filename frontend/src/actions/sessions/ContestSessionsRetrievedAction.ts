import { Action, Dispatch } from "redux";
import { Rest } from "backend";
import { ActionType } from "../ActionType";

export interface ContestSessionsRetrievedAction extends Action<ActionType.ContestSessionsRetrieved> {
	contestId: string;
	sessions: Rest.Session[];
}

export function dispatchContestSessionsRetrievedAction(dispatch: Dispatch<ContestSessionsRetrievedAction>, contestId: string, sessions: Rest.Session[]): void {
	dispatch({
		contestId,
		type: ActionType.ContestSessionsRetrieved,
		sessions
	});
}
