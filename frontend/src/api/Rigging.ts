import { authHeader, buildApiUrl, jsonHeader } from "./utils";


export interface GetRiggingTokenOptions {
	username: string;
	password: string;
}

export async function getRiggingToken(params: GetRiggingTokenOptions): Promise<string> {
	const url = buildApiUrl(`rigging/token`);
	const response = await fetch(
		url.toString(),
		{
			headers: {
				"Username": params.username,
				"Password": params.password
			}
		}
	)
	return (response.status !== 200) ? null : await response.text();
}

export async function fetchGoogleAuthUrl(token: string, state?: string): Promise<{authUrl: string}> {
	const url = buildApiUrl(`rigging/google`);

	const queryParameters: Record<string, string> = {};
	if (state != null) {
		queryParameters.state = state;
	}

	url.search = new URLSearchParams(queryParameters).toString();

	const response = await fetch(
		url.toString(),
		{
			headers: {
				...authHeader(token)
			}
		}
	);

	return await response.json();
}

export async function writeGoogleAuthCode(token: string, code: string): Promise<void> {
	const url = buildApiUrl(`rigging/google`);

	fetch(
		url.toString(),
		{
			method: "PATCH",
			headers: {
				...jsonHeader(),
				...authHeader(token)
			},
			body: JSON.stringify({
				code
			})
		}
	);
}
