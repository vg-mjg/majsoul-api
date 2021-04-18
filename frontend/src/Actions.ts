import { Action, Dispatch } from "redux";
import { Store, Rest } from "majsoul-api";
import { ThunkAction } from "redux-thunk";
import { IState, ContestTeam } from "./State";
import { Config, Contest, GameResult } from "majsoul-api/dist/store";

export type AppThunk<AType extends Action<ActionType>, TReturn = void> =  ThunkAction<TReturn, IState, unknown, AType>;

export enum ActionType {
	ContestSummaryRetrieved,
	GamesRetrieved,
	RiggingTokenGet,
	SessionPatched,
	LogOut,
	PatchTeam,
	GetContestSessions,
	GetContestPlayers,
	GetContestPlayerGames,
	GetContests,
	ContestPatched,
	ContestCreated,
}

export type MajsoulAction = SummaryRetrievedAction
	| SessionGamesRetrieved
	| RiggingTokenAquired
	| SessionPatched
	| PatchTeam
	| GetContestSessions
	| GetContestPlayers
	| GetContestPlayerGames
	| GetContests
	| CreateContest
	| ContestPatched
	| LogOutAction;

export interface SummaryRetrievedAction extends Action<ActionType.ContestSummaryRetrieved> {
	contest: Store.Contest<string>;
}

export interface SessionGamesRetrieved extends Action<ActionType.GamesRetrieved> {
	games: Rest.GameResult[];
}

export interface RiggingTokenAquired extends Action<ActionType.RiggingTokenGet> {
	token: string;
}

export interface SessionPatched extends Action<ActionType.SessionPatched> {
	session: Store.Session;
}

export interface PatchTeam extends Action<ActionType.PatchTeam> {
	team: ContestTeam;
}

export interface GetContestSessions extends Action<ActionType.GetContestSessions> {
	contestId: string;
	sessions: Rest.Session[];
}

export interface GetContestPlayers extends Action<ActionType.GetContestPlayers> {
	contestId: string;
	players: Rest.ContestPlayer[];
}

export interface GetContestPlayerGames extends Action<ActionType.GetContestPlayerGames> {
	games: Store.GameResult[];
}

export interface GetContests extends Action<ActionType.GetContests> {
	contests: Store.Contest[];
}

export interface CreateContest extends Action<ActionType.ContestCreated> {
	contest: {
		_id: string;
	};
}

export interface LogOutAction extends Action<ActionType.LogOut> {

}

export interface ContestPatched extends Action<ActionType.ContestPatched> {
	contest: Omit<Store.Contest, "teams" | "session">;
}

export function buildApiUrl(path: string): URL {
	if (process.env.NODE_ENV === "production") {
		return new URL(`${location.protocol}//${location.host}/api/${path}`);
	}
	return new URL(`${location.protocol}//${location.hostname}:9515/${path}`);
}

export function fetchContestSummary(dispatch: Dispatch, contestId: string): Promise<Store.Contest<string>> {
	const fetchPromise = fetch(buildApiUrl(`contests/${contestId}`).toString())
		.then(response => response.json());

	fetchPromise.then(contest => dispatch({
			type: ActionType.ContestSummaryRetrieved,
			contest
		}));

	return fetchPromise;
}

export function fetchContestSessions(dispatch: Dispatch<GetContestSessions>, contestId: string): void {
	fetch(buildApiUrl(`contests/${contestId}/sessions`).toString())
		.then(response => response.json())
		.then(sessions => dispatch({
			contestId,
			type: ActionType.GetContestSessions,
			sessions
		}));
}

interface FetchContestPlayerParams {
	contestId: string | number,
	gameLimit?: number,
	ignoredGames?: number,
}

export function fetchContestPlayers(
	dispatch: Dispatch,
	params: FetchContestPlayerParams,
): void {
	fetchContestPlayersDirect(params).then(players => dispatch({
		type: ActionType.GetContestPlayers,
		contestId: params.contestId,
		players
	}));
}

export function fetchContestPlayersDirect(
	params: FetchContestPlayerParams,
): Promise<Array<Rest.ContestPlayer<any>>> {
	const url = buildApiUrl(`contests/${params.contestId}/players`);
	const queryParameters: Record<string, string> = {};
	if (params.gameLimit != null) {
		queryParameters.gameLimit = params.gameLimit.toString();
	}

	if (params.ignoredGames != null) {
		queryParameters.ignoredGames = params.ignoredGames.toString();
	}

	url.search = new URLSearchParams(queryParameters).toString();

	return fetch(url.toString())
		.then(response => response.json());
}

export function fetchContestPlayerGames(dispatch: Dispatch, contestId: string, playerId: string): void {
	fetch(buildApiUrl(`contests/${contestId}/players/${playerId}/games`).toString())
		.then(response => response.json())
		.then(games => dispatch({
			type: ActionType.GetContestPlayerGames,
			games
		}));
}

export function fetchContests(dispatch: Dispatch): void {
	fetch(buildApiUrl(`contests`).toString())
		.then(response => response.json())
		.then(contests => dispatch({
			type: ActionType.GetContests,
			contests
		}));
}

export function putContest(dispatch: Dispatch<CreateContest>, token: string): void {
	fetch(
		buildApiUrl(`contests`).toString(),
		{
			method: "PUT",
			headers: {
				'Authorization': `Bearer ${token}`
			},
		}
	)
		.then(response => response.json())
		.then(contest => dispatch({
			type: ActionType.ContestCreated,
			contest
		}));
}
export interface FetchGamesOptions {
	sessionIds?: string[];
	last?: number;
	contestIds?: string[];
}

export function fetchGamesHook(dispatch: Dispatch, params: FetchGamesOptions): void {
	const url = buildApiUrl(`games`);
	const queryParameters: Record<string, string> = {};
	if (params.sessionIds != null) {
		queryParameters.sessions = params.sessionIds?.join('+');
	}

	if (params.contestIds != null) {
		queryParameters.contests = params.contestIds?.join('+');
	}

	if (params.last != null) {
		queryParameters.last = params.last?.toString();
	}

	url.search = new URLSearchParams(queryParameters).toString();

	fetch(url.toString())
		.then(response => response.json())
		.then(games => dispatch({
			type: ActionType.GamesRetrieved,
			games
		}));
}

export function patchSession(dispatch: Dispatch, token: string, session: Rest.Session): Promise<unknown> {
	const url = buildApiUrl(`sessions/${session._id}`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ scheduledTime: session.scheduledTime })
		})
		.then(response => response.json())
		.then(session => dispatch({
			type: ActionType.SessionPatched,
			session
		}));
}

export function updateConfig(dispatch: Dispatch, token: string, config: Partial<Config>): Promise<unknown> {
	const url = buildApiUrl(`config`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ featuredContest: config.featuredContest })
		})
		.then(response => response.json());
}

export async function fetchConfig(dispatch: Dispatch): Promise<Config> {
	const response = await fetch(buildApiUrl(`config`).toString());
	return await response.json();
}

export function patchContest(dispatch: Dispatch, token: string, id: string, contest: Partial<Contest<string>>): Promise<unknown> {
	const url = buildApiUrl(`contests/${id}`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({
				anthem: contest.anthem,
				tagline: contest.tagline,
				taglineAlternate: contest.taglineAlternate,
				majsoulFriendlyId: contest.majsoulFriendlyId,
				type: contest.type,
				displayName: contest.displayName,
				maxGames: contest.maxGames,
				bonusPerGame: contest.bonusPerGame,
				track: contest.track,
			})
		})
		.then(response => response.json())
		.then(contest => dispatch({
			type: ActionType.ContestPatched,
			contest
		}));
}

export async function createGame(dispatch: Dispatch, token: string, game: Partial<GameResult<string>>): Promise<string> {
	const url = buildApiUrl(`games/`);
	const response = await fetch(
		url.toString(),
		{
			method: "PUT",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({
				contestId: game.contestId,
				majsoulId: game.majsoulId,
			})
		}
	);
	return await response.json();
}

export async function deleteGame(dispatch: Dispatch, token: string, id: string): Promise<void> {
	const url = buildApiUrl(`games/${id}`);
	const response = await fetch(
		url.toString(),
		{
			method: "DELETE",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		}
	);
}

export async function  fetchPendingGames(dispatch: Dispatch, id: string): Promise<GameResult<string>[]> {
	const url = buildApiUrl(`contests/${id}/pendingGames/`);
	const response = await fetch(url.toString());
	return await response.json();
}

export async function fetchGame(dispatch: Dispatch, id: string): Promise<GameResult<string>> {
	const url = buildApiUrl(`games/${id}`);
	const response = await fetch(url.toString());
	return await response.json();
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

export function fetchYakuman(dispatch: Dispatch, contestId: string): void {
	fetch(buildApiUrl(`contests/${contestId}/yakuman`).toString())
		.then(response => response.json())
		.then(games => dispatch({
			type: ActionType.GamesRetrieved,
			games
		}));
}

export function logout(dispatch: Dispatch<LogOutAction>) {
	dispatch({type: ActionType.LogOut});
}

export function patchTeam(dispatch: Dispatch, token: string, team: ContestTeam): Promise<unknown> {
	const url = buildApiUrl(`teams/${team._id}`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify(team)
		})
		.then(response => response.json())
		.then(team => dispatch({
			type: ActionType.PatchTeam,
			team
		}));
}
