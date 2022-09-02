import { Action, Dispatch } from "redux";
import { Store } from "backend";
import { ActionType } from "../ActionType";

export interface TeamCreatedAction extends Action<ActionType.TeamCreated> {
	contestId: string;
	team: Store.ContestTeam;
}

export function dispatchTeamCreatedAction(
	dispatch: Dispatch<TeamCreatedAction>,
	contestId: string,
	team: Store.ContestTeam,
) {
	dispatch({
		type: ActionType.TeamCreated,
		team,
		contestId,
	});
}
