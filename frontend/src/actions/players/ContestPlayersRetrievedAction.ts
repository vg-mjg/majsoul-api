import { Action, Dispatch } from "redux";
import { Rest } from "majsoul-api";
import { ActionType } from "../ActionType";

export interface ContestPlayersRetrievedAction extends Action<ActionType.ContestPlayersRetrieved> {
	contestId: string;
	players: Rest.ContestPlayer[];
}

export function dispatchContestPlayersRetrieved(
	dispatch: Dispatch<ContestPlayersRetrievedAction>,
	contestId: string,
	players: Rest.ContestPlayer<string>[]
): void {
	dispatch({
		type: ActionType.ContestPlayersRetrieved,
		contestId: contestId,
		players
	});
}
