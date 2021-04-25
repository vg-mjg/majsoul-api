import { Rest } from "majsoul-api";
import { buildApiUrl } from "./utils";

interface FetchContestPlayerParams {
	contestId: string,
	gameLimit?: number,
	ignoredGames?: number,
}

export function fetchContestPlayers(
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
