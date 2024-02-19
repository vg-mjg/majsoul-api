import { Rest } from "backend";
import { Action, Dispatch } from "redux";

import { ActionType } from "../ActionType";

export interface GamesRetrievedAction extends Action<ActionType.GamesRetrieved> {
	games: Rest.GameResult[];
}

export function dispatchGamesRetrievedAction(
	dispatch: Dispatch<GamesRetrievedAction>,
	games: Rest.GameResult<string>[]
): void {
	dispatch({
		type: ActionType.GamesRetrieved,
		games
	});
}
