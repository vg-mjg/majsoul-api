import { Config } from "majsoul-api/dist/store";
import { authHeader, buildApiUrl, jsonHeader } from "./utils";

export async function fetchConfig(): Promise<Config> {
	const response = await fetch(buildApiUrl(`config`).toString());
	return await response.json();
}

export function updateConfig(token: string, config: Partial<Config>): Promise<unknown> {
	const url = buildApiUrl(`config`);
	return fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				...jsonHeader(),
				...authHeader(token),
			},
			body: JSON.stringify({ featuredContest: config.featuredContest })
		})
		.then(response => response.json());
}
