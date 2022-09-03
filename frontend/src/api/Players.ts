import type { Rest, Store } from "backend";
import { buildApiUrl } from "./utils";

interface FetchContestPlayerParams {
	contestId: string;
	gameLimit?: number;
	ignoredGames?: number;
	teamId?: string;
}

export async function fetchContestPlayers(
	params: FetchContestPlayerParams,
): Promise<Array<Rest.ContestPlayer<string>>> {
	const url = buildApiUrl(`contests/${params.contestId}/players`);
	const queryParameters: Record<string, string> = {};
	if (params.gameLimit != null) {
		queryParameters.gameLimit = params.gameLimit.toString();
	}

	if (params.ignoredGames != null) {
		queryParameters.ignoredGames = params.ignoredGames.toString();
	}

	if (params.teamId != null) {
		queryParameters.teamId = params.teamId;
	}

	url.search = new URLSearchParams(queryParameters).toString();

	const response = await fetch(url.toString());
	if (response.status !== 200) {
		throw {
			status: response.status
		};
	}
	return await response.json();
}

export async function fetchPlayers(params: {
	limit?: number;
	name?: string;
}): Promise<Array<Store.Player<string>>> {
	const url = buildApiUrl("players/");
	const queryParameters: Record<string, string> = {};
	if (params.limit != null) {
		queryParameters.limit = params.limit.toString();
	}

	if (params.name != null) {
		queryParameters.name = params.name;
	}

	url.search = new URLSearchParams(queryParameters).toString();

	const response = await fetch(url.toString());
	if (response.status !== 200) {
		throw {
			status: response.status
		};
	}
	return await response.json();
}
