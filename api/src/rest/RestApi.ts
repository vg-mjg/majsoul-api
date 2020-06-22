import * as express from 'express';
import * as cors from "cors";
import * as store from '../store';
import { Contest } from './types/types';
import { ObjectId, FilterQuery } from 'mongodb';
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import * as expressJwt from 'express-jwt';


export class RestApi {
	private app: express.Express;

	constructor(private readonly mongoStore: store.Store) {
		this.app = express();
		this.app.use(cors());

		this.app.get<any, Contest<ObjectId>>('/contests/:id', (req, res) => {
			this.mongoStore.contestCollection.findOne(
				{ majsoulFriendlyId: parseInt(req.params.id) }
			).then(async (contest) => {
				res.send({
					...contest,
					sessions: await Promise.all(contest.sessions.map(async (session) => ({
						...session,
						totals: await this.getSessionSummary(contest, session)
					})))
				});
			})
			.catch(error => {
				console.log(error);
				res.status(500).send(error)
			});
		});

		this.app.get('/games', (req, res) => {
			const filter: FilterQuery<store.GameResult<ObjectId>> = {};

			const sessionIds = (req.query?.sessions as string)?.split(' ');
			if (sessionIds) {
				console.log(sessionIds);
				filter.sessionId = { $in: sessionIds.map(id => new ObjectId(id)) };
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
				.then(games => res.send(games))
				.catch(error => {
					console.log(error);
					res.status(500).send(error)
				});
		});
	}

	public async init() {
		this.app.listen(9515, () => console.log(`Express started`));

		const riggingRouter = await this.createRiggingRouter();
		if (!riggingRouter) {
			return;
		}

		this.app.use("/rigging", riggingRouter);

		const salt = crypto.randomBytes(24).toString("hex");
		const sha = crypto.createHash("sha256");
		this.mongoStore.userCollection.findOneAndUpdate(
			{
				nickname: "test",
			},
			{
				$setOnInsert: {
					password : {
						salt,
						hash: sha.update("asdf:"+salt).digest("hex")
					},
					scopes: ["root"]
				}
			},
			{ upsert: true }
		);

	}

	private async createRiggingRouter(): Promise<express.Router> {
		const keyLocation = process.env.NODE_ENV === "production" ? "/run/secrets/" : path.dirname(process.argv[1]);
		let privateKey: Buffer, publicKey: Buffer;

		try {
			privateKey = await new Promise<Buffer>((res, rej) => fs.readFile(path.join(keyLocation, "riichi.key.pem"), (err, key) => {
				if (err) {
					console.log("couldn't load private key for auth tokens, disabling rigging");
					console.log(err);
					return;
				}
				res(key);
			}));

			publicKey = await new Promise<Buffer>((res, rej) => fs.readFile(path.join(keyLocation, "riichi.crt.pem"), (err, key) => {
				if (err) {
					rej(err);
					return;
				}
				res(key);
			}));
		} catch (err) {
			console.log("Couldn't load keys for auth tokens, disabling rigging");
			console.log(err);
		}

		const router = express.Router();
		router.use(
				expressJwt({
					secret: publicKey,
					credentialsRequired: true
				}).unless({
					path: ["/token"],
					useOriginalUrl: false
				})
			).use(function (err, req, res, next) {
				if (err.name === 'UnauthorizedError') {
				  res.status(401).send('token invalid');
				  return;
				}
				next();
			})
			.get("/token", async (req, res) => {
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
		return router;
	}

	private async getSessionSummary(contest: store.Contest, session: store.Session): Promise<Record<string, number>> {
		const games = await this.mongoStore.gamesCollection.find({
			sessionId: session._id
		}).toArray();
		return games.reduce<Record<string, number>>((total, game) => {
			game.finalScore.forEach((score, index) => {
				const winningTeam = contest.teams.find(t => t.players.find(p => p._id.equals(game.players[index]._id)));
				if(!winningTeam) {
					console.log(session._id);
					console.log(game);
				}
				total[winningTeam._id.toHexString()] = (total[winningTeam._id.toHexString()] ?? 0) + score.uma;
			});
			return total;
		}, {});
	}
}
