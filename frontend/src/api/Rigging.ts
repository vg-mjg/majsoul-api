import { buildApiUrl } from "./utils";


export interface GetRiggingTokenOptions {
	username: string;
	password: string;
}

export async function getRiggingToken (params: GetRiggingTokenOptions): Promise<string> {
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
