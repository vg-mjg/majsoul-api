import { Action, Dispatch } from "redux";
import { Store } from "backend";
import { ActionType } from "../ActionType";

export interface TeamPatchedAction extends Action<ActionType.TeamPatched> {
	contestId: string;
	team: Store.ContestTeam;
}

export function dispatchTeamPatchedAction(dispatch: Dispatch<TeamPatchedAction>, contestId: string, team: Store.ContestTeam) {
	dispatch({
		type: ActionType.TeamPatched,
		contestId,
		team
	});
}
