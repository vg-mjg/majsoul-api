import { Rest,Store } from "backend";

import { authHeader, buildApiUrl, jsonHeader } from "./utils";

export function fetchContestSummary(contestId: string): Promise<Store.Contest<string>> {
	return fetch(buildApiUrl(`contests/${contestId}`).toString())
		.then(response => response.json());
}

export function fetchContestImages(contestId: string): Promise<Store.Contest<string>> {
	return fetch(buildApiUrl(`contests/${contestId}/images`).toString())
		.then(response => response.json());
}

export function fetchContestGachaCard(contestId: string, gachaId: string): Promise<Store.GachaCard<string>> {
	return fetch(buildApiUrl(`contests/${contestId}/images/${gachaId}`).toString())
		.then(response => response.json());
}

export function fetchContests(): Promise<Store.Contest<string>[]> {
	return fetch(buildApiUrl("contests").toString())
		.then(response => response.json());
}

export function createContest(token: string): Promise<Pick<Store.Contest<string>, "_id">> {
	return fetch(
		buildApiUrl("contests").toString(),
		{
			method: "PUT",
			headers: {
				...authHeader(token)
			},
		}
	).then(response => response.json());
}

export function patchContest(token: string, id: string, contest: Partial<Rest.Contest<string>>): Promise<Omit<Rest.Contest, "teams" | "session">> {
	const url = buildApiUrl(`contests/${id}`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify({
				...contest,
			})
		})
		.then(response => response.json());
}

export function fetchPhases(id: string): Promise<Rest.Phase[]> {
	const url = buildApiUrl(`contests/${id}/phases`);
	return fetch(
		url.toString(),
		{
			method: "GET",
		})
		.then(response => response.json());
}

export function fetchPhase(id: string, phaseIndex: number): Promise<Rest.Phase> {
	const url = buildApiUrl(`contests/${id}/phases/${phaseIndex}`);
	return fetch(
		url.toString(),
		{
			method: "GET",
		})
		.then(response => response.json());
}

export function fetchActivePhase(id: string): Promise<Rest.Phase> {
	const url = buildApiUrl(`contests/${id}/phases/active`);
	return fetch(
		url.toString(),
		{
			method: "GET",
		})
		.then(response => response.json());
}

interface AllPlayersStatsRequest {
	players: true;
}

interface PlayerStatsRequest {
	player: string;
}

interface TeamStatsRequest {
	team: string;
}

export type StatsRequest = AllPlayersStatsRequest | PlayerStatsRequest | TeamStatsRequest;

export function fetchStats(
	contestId: string,
	statsRequest: StatsRequest,
): Promise<Record<string, Rest.Stats>> {
	const url = buildApiUrl(`contests/${contestId}/stats`);
	const queryParameters: Record<string, string> = {};

	if ("team" in statsRequest) {
		queryParameters.team = statsRequest.team;
	}

	if ("players" in statsRequest) {
		queryParameters.players = statsRequest.players.toString();
	}

	if ("player" in statsRequest) {
		queryParameters.player = statsRequest.player;
	}

	url.search = new URLSearchParams(queryParameters).toString();

	return fetch(url.toString())
		.then(response => response.json());
}
