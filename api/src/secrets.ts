import { Credentials } from 'google-auth-library';
import * as fs from "fs";
import * as path from "path";

export interface ISecrets {
	majsoul: {
		uid: string;
		accessToken: string;
	};
	google: {
		clientId: string;
		clientSecret: string;
	}
	mongo: {
		username: string;
		password: string;
	}
	riichiRoot: {
		username: string;
		password: string;
	}
}

export function getSecretsFilePath(): string {
	return process.env.NODE_ENV === "production"
		? "/run/secrets/majsoul.json"
		: path.join(path.dirname(__filename), 'secrets.json');
}

export function getSecrets() : ISecrets {
	return JSON.parse(fs.readFileSync(getSecretsFilePath(), 'utf8'));
}
