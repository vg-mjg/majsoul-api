import * as dayjs from "dayjs";

export function buildApiUrl(path: string): URL {
	if (process.env.NODE_ENV === "production") {
		return new URL(`${location.protocol}//${location.host}/api/${path}`);
	}
	return new URL(`${location.protocol}//${location.hostname}:9515/${path}`);
}

export function jsonHeader(): {
	"Accept": "application/json";
	"Content-Type": "application/json";
	} {
	return {
		"Accept": "application/json",
		"Content-Type": "application/json",
	};
}

export function authHeader(token: string): {
	"Authorization": string;
} {
	return {
		"Authorization": `Bearer ${token}`
	};
}

export function withLocale(locale: string, format: string): (this: dayjs.Dayjs, now: dayjs.Dayjs) => string {
	return function(this: dayjs.Dayjs, now: dayjs.Dayjs) {
		return this.locale(locale).format(format);
	};
}

export function hashCode(s: string): number {
	const l = s.length;
	let h = 0, i = 0;
	if ( l > 0 ) {
		while (i < l) {
			h = (h << 5) - h + s.charCodeAt(i++) | 0;
		}
	}
	return h;
}
