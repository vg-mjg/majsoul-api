import { Store } from "majsoul-api";
import { authHeader, buildApiUrl, jsonHeader } from "./utils";

export function fetchContestSummary(contestId: string): Promise<Store.Contest<string>> {
	return fetch(buildApiUrl(`contests/${contestId}`).toString())
		.then(response => response.json());
}

export function fetchContests(): Promise<Store.Contest<string>[]> {
	return fetch(buildApiUrl(`contests`).toString())
		.then(response => response.json())
}

export function createContest(token: string): Promise<Pick<Store.Contest<string>, "_id">> {
	return fetch(
		buildApiUrl(`contests`).toString(),
		{
			method: "PUT",
			headers: {
				...authHeader(token)
			},
		}
	).then(response => response.json())
}

export function patchContest(token: string, id: string, contest: Partial<Store.Contest<string>>): Promise<Omit<Store.Contest, "teams" | "session">> {
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
}
