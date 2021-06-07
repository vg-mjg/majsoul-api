import { Rest, Store } from "majsoul-api";
import { authHeader, buildApiUrl, jsonHeader } from "./utils";

export async function createSession(token: string, contestId: string): Promise<Store.Session> {
	const url = buildApiUrl(`sessions/`);
	const response = await fetch(
		url.toString(),
		{
			method: "PUT",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify({
				contestId
			})
		}
	);
	return await response.json();
}


export function fetchContestSessions(contestId: string): Promise<Rest.Session[]> {
	return fetch(buildApiUrl(`contests/${contestId}/sessions`).toString())
		.then(response => response.json());
}

export function patchSession(token: string, session: Partial<Store.Session>): Promise<Store.Session> {
	const url = buildApiUrl(`sessions/${session._id}/`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify(session)
		})
		.then(response => response.json());
}

export async function deleteSession(token: string, sessionId: string): Promise<void> {
	const url = buildApiUrl(`sessions/${sessionId}/`);
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
