import * as express from 'express';
import * as cors from "cors";
import * as store from '../store';
import { Contest, GameResult, Session } from './types/types';
import { ObjectId, FilterQuery, Condition } from 'mongodb';
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import * as expressJwt from 'express-jwt';


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

	private app: express.Express;

	constructor(private readonly mongoStore: store.Store) {
		this.app = express();
		this.app.use(cors());
		this.app.use(express.json());

		this.app.get<any, Contest<ObjectId>>('/contests/:id', (req, res) => {
			this.mongoStore.contestCollection.findOne(
				{ majsoulFriendlyId: parseInt(req.params.id) }
			).then(async (contest) => {
				const sessions = await mongoStore.sessionsCollection.find({
					contestId: contest._id
				}).toArray();

				res.send({
					...contest,
					sessions: (await Promise.all(sessions.sort((a, b) => a.scheduledTime - b.scheduledTime).map(async (session, index) => ({
						...session,
						totals: await this.getSessionSummary(contest, session, sessions[index + 1])
					})))).reverse()
				});
			})
			.catch(error => {
				console.log(error);
				res.status(500).send(error)
			});
		});

		this.app.get<any, GameResult<ObjectId>[]>('/games', async (req, res) => {
			const filter: FilterQuery<store.GameResult<ObjectId>> = {};

			const sessionIds = (req.query?.sessions as string)?.split(' ');
			let sessionMap: {
				startSession: store.Session,
				endSession: store.Session
			}[] = [];
			if (sessionIds) {
				const sessions = await this.mongoStore.sessionsCollection.find({
					_id: { $in: sessionIds.map(id => new ObjectId(id)) }
				}).toArray();

				filter.$or = [];

				for(const session of sessions) {
					let [startSession, endSession] = await this.mongoStore.sessionsCollection.find(
						{scheduledTime: {$gte: session.scheduledTime}}
					).sort({scheduledTime: 1}).limit(2).toArray();

					sessionMap.push({
						startSession,
						endSession
					});

					filter.$or.push({
						end_time: {
							$gte: startSession.scheduledTime,
							$lt: endSession?.scheduledTime
						}
					});
				}
			}

			const cursor = this.mongoStore.gamesCollection.find(filter);

			if (req.query?.last) {
				const last = parseInt(req.query.last as string);
				if (last) {
					cursor.sort({end_time: -1})
					.limit(last);
				}
			}

			cursor.toArray()
				.then(games => res.send(games.map(game => ({
					...game,
					sessionId: sessionMap.find((session) =>
						game.end_time >= session.startSession.scheduledTime
							&& game.end_time < session.endSession.scheduledTime)?.startSession?._id
				}))))
				.catch(error => {
					console.log(error);
					res.status(500).send(error)
				});
		});
	}

	public async init(root: {username: string, password: string}) {
		if (root?.username != null && root?.password != null) {
			const salt = crypto.randomBytes(24).toString("hex");
			const sha = crypto.createHash("sha256");
			await this.mongoStore.userCollection.findOneAndUpdate(
				{
					nickname: root.username,
				},
				{
					$setOnInsert: {
						password : {
							salt,
							hash: sha.update(`${root.password}:${salt}`).digest("hex")
						},
						scopes: ["root"]
					}
				},
				{ upsert: true }
			);
		}

		this.app.listen(9515, () => console.log(`Express started`));

		let privateKey: Buffer, publicKey: Buffer;
		try {
			privateKey = await RestApi.getKey("riichi.key.pem");
			publicKey = await RestApi.getKey("riichi.crt.pem");
		} catch (err) {
			console.log("Couldn't load keys for auth tokens, disabling rigging");
			console.log(err);
			return;
		}

		this.app.use(
			expressJwt({
				secret: publicKey,
				audience: "riichi.moe",
				issuer: "riichi.moe",
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

		.patch<any, Session<ObjectId>>('/sessions/:id', (req, res) => {
			const patch = req.body as Session<string>;
			if (patch?.scheduledTime == undefined) {
				res.sendStatus(304);
				return;
			}

			this.mongoStore.sessionsCollection.findOneAndUpdate(
				{ _id: new ObjectId(req.params.id) },
				{ $set: { scheduledTime: patch.scheduledTime } },
				{ returnOriginal: false }
			).then((session) => {
				res.send({
					_id: session.value._id,
					scheduledTime: session.value.scheduledTime
				} as Session);
			}).catch((err) => {
				console.log(err);
				res.status(500).send(err);
			})
		})

		.get("/rigging/token", async (req, res) => {
			const user = await this.mongoStore.userCollection.findOne({
				nickname: req.header("Username") as string,
			});

			if (!user) {
				res.sendStatus(401);
				return;
			}

			const sha = crypto.createHash("sha256");
			if (user.password.hash !== sha.update(`${req.header("Password") as string}:${user.password.salt}`).digest("hex")) {
				res.sendStatus(401);
				return;
			}

			jwt.sign(
				{
					name: user.nickname,
					roles: user.scopes
				},
				privateKey,
				{
					algorithm: 'RS256',
					issuer: "riichi.moe",
					audience: "riichi.moe",
					expiresIn: "1d",
					notBefore: 0,
				},
				(err, token) => {
				if (err) {
					console.log(err);
					res.status(500).send(err);
					return;
				}
				res.send(token);
			});
		})
		.get("/users", (req, res) => {
			res.send("test");
		});
	}

	private async getSessionSummary(contest: store.Contest, startSession: store.Session, endSession?: store.Session): Promise<Record<string, number>> {
		const timeWindow: Condition<number> = {
			$gte: startSession.scheduledTime
		};

		if (endSession) {
			timeWindow.$lt = endSession.scheduledTime
		}

		const games = await this.mongoStore.gamesCollection.find({
			end_time: timeWindow
		}).toArray();

		return games.reduce<Record<string, number>>((total, game) => {
			game.finalScore.forEach((score, index) => {
				const winningTeam = contest.teams.find(t => t.players.find(p => p._id.equals(game.players[index]._id)));
				total[winningTeam._id.toHexString()] = (total[winningTeam._id.toHexString()] ?? 0) + score.uma;
			});
			return total;
		}, {});
	}
}
