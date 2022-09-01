import express from 'express';
import cors from "cors";
import * as store from '../store/index.js';
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { google } from 'googleapis';
import { getSecrets } from '../secrets.js';
import { contestRoute } from './routes/contest/ContestRoute.js';
import { RouteState } from './routes/RouteState.js';
import { registerAdminMethods, registerPublicMethods } from './routes/Route.js';
import { expressjwt } from 'express-jwt';

export class RestApi {
	private static getKey(keyName: string): Promise<Buffer> {
		return new Promise<Buffer>((res, rej) => fs.readFile(path.join(RestApi.keyLocation, keyName), (err, key) => {
			if (err) {
				console.log("couldn't load private key for auth tokens, disabling rigging");
				console.log(err);
				return;
			}
			res(key);
		}));
	}

	private static get keyLocation(): string {
		return process.env.NODE_ENV === "production" ? "/run/secrets/" : path.dirname(process.argv[1]);
	}

	constructor(private readonly mongoStore: store.Store) {}

	public async init(root: { username: string, password: string }) {
		const app = express();
		app.use(cors());
		app.use(express.json({ limit: "1MB" }));

		const secrets = getSecrets();
		const oauth2Client = new google.auth.OAuth2(
			secrets.google.clientId,
			secrets.google.clientSecret,
			`${process.env.NODE_ENV === "production" ? "https" : `http`}://${process.env.NODE_ENV === "production" ? "riichi.moe" : `localhost:8080`}/rigging/google`
		);

		if (root?.username != null && root?.password != null) {
			const salt = crypto.randomBytes(24).toString("hex");
			const sha = crypto.createHash("sha256");
			await this.mongoStore.userCollection.findOneAndUpdate(
				{
					nickname: root.username,
				},
				{
					$setOnInsert: {
						password: {
							salt,
							hash: sha.update(`${root.password}:${salt}`).digest("hex")
						},
						scopes: ["root"]
					}
				},
				{ upsert: true }
			);
		}

		app.listen(9515, () => console.log(`Express started`));

		let privateKey: Buffer, publicKey: Buffer;
		try {
			privateKey = await RestApi.getKey("riichi.key.pem");
			publicKey = await RestApi.getKey("riichi.crt.pem");
		} catch (err) {
			console.log("Couldn't load keys for auth tokens, disabling rigging");
			console.log(err);
			return;
		}

		const state = new RouteState(
			this.mongoStore,
			oauth2Client,
			privateKey,
		);

		registerPublicMethods(contestRoute, state, app);

		registerAdminMethods(
			contestRoute,
			state,
			app.use(
				expressjwt({
					secret: publicKey,
					audience: "riichi.moe",
					issuer: "riichi.moe",
					algorithms: ["RS256"],
					credentialsRequired: true,
				}).unless({
					method: "GET"
				})
			).use(function (err, req, res, next) {
				if (err.name === 'UnauthorizedError') {
					res.status(401).send('token invalid');
					return;
				}
				next();
			})
		);
	}
}
