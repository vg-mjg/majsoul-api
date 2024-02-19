import fetch, { HeadersInit } from "node-fetch";

import { Passport } from "./types/Passport";

interface Cookie {
	key: string;
	value: string;
	expires?: number;
}

export async function getPassport(
	{userId, accessToken, userAgent, existingCookies }: {
			userId: string;
			accessToken: string;
			userAgent: string;
			existingCookies: Cookie[];
		}
): Promise<{
		passport: Passport,
		loginCookies: Cookie[]
	}> {
	const sharedSpoofHeaders = {
		"User-Agent": userAgent
	};

	console.log(sharedSpoofHeaders);

	const cookie = (existingCookies)
		.map(cookie => `${cookie.key}=${cookie.value}`).join(";");

	console.log(cookie, cookie.length);

	const optionsHeaders: HeadersInit = {
		...sharedSpoofHeaders,
	};

	if (cookie.length) {
		(optionsHeaders as any).cookie = cookie;
	}

	const loginCookies = [...existingCookies];

	try {
		const headers = (await fetch("https://passport.mahjongsoul.com/user/login", {
			method: "OPTIONS",
			headers: optionsHeaders,
		})).headers.raw();
		console.log(headers);


		const cookieTime = Date.now();

		const newCookies = headers["set-cookie"]
			?.map(cookie => {
				const parts = cookie.split(";").map(part => part.trim().split(/=(.*)/s));
				const [key, value] = parts[0];

				const maxAgePart = parts.find(([key]) => key.startsWith("Max-Age"));

				if (maxAgePart) {
					const maxAge = parseInt(maxAgePart[1]);
					if (!isNaN(maxAge)) {
						return {
							key,
							value,
							expires: cookieTime + maxAge * 1000
						};
					}
				}

				const expires = parts.find(([key]) => key.startsWith("expires"));
				if (!expires) {
					return {
						key,
						value,
						expires: cookieTime + 24 * 60 * 60 * 1000
					};
				}

				return {
					key,
					value,
					expires: Date.parse(expires[1])
				};
			}) ?? [];

		console.log(newCookies);

		loginCookies.push(...newCookies);
	} catch (e) {
		console.log(e);
		return {
			passport: null,
			loginCookies
		};
	}

	const joinedCookies = loginCookies
		.map(cookie => `${cookie.key}=${cookie.value}`).join(";");

	console.log(joinedCookies);

	try {
		const passport = await (await fetch("https://passport.mahjongsoul.com/user/login", {
			method: "POST",
			headers: {
				...sharedSpoofHeaders,
				"Accept": "application/json",
				"Content-Type": "application/json",
				cookies: joinedCookies
			},
			body: JSON.stringify({
				"uid": userId,
				"token": accessToken,
				"deviceId": `web|${userId}`
			})
		})).json() as Passport;

		return {
			passport,
			loginCookies,
		};
	} catch {
		return {
			loginCookies,
			passport: null,
		};
	}
}
