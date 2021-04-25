import { Action, Dispatch } from "redux";
import { ActionType } from "../ActionType";

export interface TeamDeletedAction extends Action<ActionType.TeamDeleted> {
	contestId: string;
	teamId: string;
}

export function dispatchTeamDeletedAction(dispatch: Dispatch<TeamDeletedAction>, contestId: string, teamId: string) {
	dispatch({
		type: ActionType.TeamDeleted,
		contestId,
		teamId,
	});
}
