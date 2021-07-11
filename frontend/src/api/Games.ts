import { Rest } from "majsoul-api";
import { authHeader, buildApiUrl, jsonHeader } from "./utils";

export async function createGame(token: string, game: Partial<Rest.GameResult<string>>): Promise<string> {
	const url = buildApiUrl(`games/`);
	const response = await fetch(
		url.toString(),
		{
			method: "PUT",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify({
				contestId: game.contestId,
				majsoulId: game.majsoulId,
			})
		}
	);
	return await response.json();
}

export async function updateGame(token: string, gameId: string, game: Partial<Rest.GameResult<string>>): Promise<Rest.GameResult> {
	const url = buildApiUrl(`games/${gameId}`);
	const response = await fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify({
				...game
			})
		}
	);
	return await response.json();
}

export async function fetchGame(id: string): Promise<Rest.GameResult<string>> {
	const url = buildApiUrl(`games/${id}`);
	const response = await fetch(url.toString());
	return await response.json();
}

export async function fetchPendingGames(contestId: string): Promise<Rest.GameResult<string>[]> {
	const url = buildApiUrl(`contests/${contestId}/pendingGames/`);
	const response = await fetch(url.toString());
	return await response.json();
}

export function fetchGames(params: {
	sessionIds?: string[];
	last?: number;
	contestIds?: string[];
}): Promise<Rest.GameResult<string>[]> {
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

	return fetch(url.toString())
		.then(response => response.json());
}

export function fetchYakuman(contestId: string): Promise<Rest.YakumanInformation[]> {
	return fetch(buildApiUrl(`contests/${contestId}/yakuman`).toString())
		.then(response => response.json())
}

export function fetchContestPlayerGames(contestId: string, playerId: string): Promise<Rest.GameResult<string>[]> {
	return fetch(buildApiUrl(`contests/${contestId}/players/${playerId}/games`).toString())
		.then(response => response.json());
}

export async function deleteGame(token: string, id: string): Promise<void> {
	const url = buildApiUrl(`games/${id}`);
	const response = await fetch(
		url.toString(),
		{
			method: "DELETE",
			headers: {
				...authHeader(token)
			}
		}
	);
}
