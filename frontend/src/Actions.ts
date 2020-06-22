import { Action } from "redux";
import { Store, Rest } from "majsoul-api";
import { ThunkAction } from "redux-thunk";
import { IState } from "./State";

export type AppThunk<AType extends Action<ActionType>, TReturn = void> =  ThunkAction<TReturn, IState, unknown, AType>;

export enum ActionType {
	ContestSummaryRetrieved,
	GamesRetrieved,
	RiggingTokenGet,
}

export interface SummaryRetrievedAction extends Action<ActionType.ContestSummaryRetrieved> {
	contest: Rest.Contest<string>;
}

export interface SessionGamesRetrieved extends Action<ActionType.GamesRetrieved> {
	games: Store.GameResult[];
}

export interface RiggingTokenAquired extends Action<ActionType.RiggingTokenGet> {
	token: string;
}

function buildApiUrl(path: string): URL {
	if (process.env.NODE_ENV === "production") {
		return new URL(`${location.protocol}//${location.host}/api/${path}`);
	}
	return new URL(`${location.protocol}//${location.hostname}:9515/${path}`);
}

export const fetchContestSummary = (contestId: string): AppThunk<SummaryRetrievedAction> => {
	return function (dispatch) {
		return fetch(buildApiUrl(`contests/${contestId}`).toString())
			.then(response => response.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest
			}));
	}
}

export interface FetchGamesOptions {
	sessionIds?: string[];
	last?: number;
}

export const fetchGames = (params: FetchGamesOptions): AppThunk<SessionGamesRetrieved> => {
	return function (dispatch) {
		const url = buildApiUrl(`games`);
		const queryParameters: Record<string, string> = {};
		if (params.sessionIds != null) {
			queryParameters.sessions = params.sessionIds?.join('+');
		}

		if (params.last != null) {
			queryParameters.last = params.last?.toString();
		}

		url.search = new URLSearchParams(queryParameters).toString();

		return fetch(url.toString())
			.then(response => response.json())
			.then(games => dispatch({
				type: ActionType.GamesRetrieved,
				games
			}));
	}
}

export interface GetRiggingTokenOptions {
	username: string;
	password: string;
}

export const getRiggingToken = (params: GetRiggingTokenOptions): AppThunk<RiggingTokenAquired, Promise<boolean>> => {
	return function (dispatch) {
		const url = buildApiUrl(`rigging/token`);
		return fetch(
			url.toString(),
			{
				headers: {
					"Username": params.username,
					"Password": params.password
				}
			}
		).then(response => {
			if (response.status !== 200) {
				return false;
			}
			response.text().then(token => dispatch({type: ActionType.RiggingTokenGet, token}));
			return true;
		});
	}
}
