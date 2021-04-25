export function buildApiUrl(path: string): URL {
	if (process.env.NODE_ENV === "production") {
		return new URL(`${location.protocol}//${location.host}/api/${path}`);
	}
	return new URL(`${location.protocol}//${location.hostname}:9515/${path}`);
}

export function jsonHeader(): {
	'Accept': 'application/json';
	'Content-Type': 'application/json';
} {
	return {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
	}
}

export function authHeader(token: string): {
	'Authorization': string;
} {
	return {
		'Authorization': `Bearer ${token}`
	}
}
