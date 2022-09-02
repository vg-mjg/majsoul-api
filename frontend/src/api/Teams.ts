import { Store } from "backend";
import { authHeader, buildApiUrl, jsonHeader } from "./utils";

export async function createTeam(token: string, contestId: string): Promise<Store.ContestTeam> {
	const url = buildApiUrl(`contests/${contestId}/teams/`);
	const response = await fetch(
		url.toString(),
		{
			method: "PUT",
			headers: {
				...authHeader(token),
			},
		}
	);
	return await response.json();
}

export async function deleteTeam(token: string, contestId: string, teamId: string): Promise<void> {
	const url = buildApiUrl(`contests/${contestId}/teams/${teamId}`);
	const response = await fetch(
		url.toString(),
		{
			method: "DELETE",
			headers: {
				...authHeader(token),
			}
		}
	);
}

export function patchTeam(token: string, contestId: string, team: Store.ContestTeam): Promise<Store.ContestTeam> {
	if (team.players === null) {
		delete team.players;
	}

	const url = buildApiUrl(`contests/${contestId}/teams/${team._id}`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify(team)
		})
		.then(response => response.json());
}
