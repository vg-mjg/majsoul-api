import { Action, Dispatch } from "redux";

import { ActionType } from "../ActionType";


export interface RiggingTokenAcquired extends Action<ActionType.RiggingTokenAcquired> {
	token: string;
}

export function dispatchRiggingTokenAcquired(dispatch: Dispatch<RiggingTokenAcquired>, token: string) {
	dispatch({
		type: ActionType.RiggingTokenAcquired,
		token
	});
}
