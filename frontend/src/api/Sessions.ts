import { Rest } from "majsoul-api";
import { buildApiUrl } from "./utils";

export function fetchContestSessions(contestId: string): Promise<Rest.Session[]> {
	return fetch(buildApiUrl(`contests/${contestId}/sessions`).toString())
		.then(response => response.json());
}
