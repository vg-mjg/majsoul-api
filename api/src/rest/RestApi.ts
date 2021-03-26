import * as express from 'express';
import * as cors from "cors";
import * as store from '../store';
import { GameResult, Session, ContestPlayer } from './types/types';
import { ObjectId, FilterQuery, Condition, MatchKeysAndValues, OnlyFieldsOfType, FindOneOptions } from 'mongodb';
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import * as expressJwt from 'express-jwt';
import { Observable } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { body, matchedData, oneOf, param, validationResult } from 'express-validator';

const sakiTeams: Record<string, Record<string, string[]>> = {
	"236728": {
		"Achiga": [
			"可愛い_Agro",
			"spinach",
			"kfarwell",
			"6k5e",
			"nyagger",
			"Nekovic",
			"dumbanon",
			"YAM",
			"Sanyap",
			"Fenryl",
			"Geh",
			"dorksport",
			"ワハハ",
			"fhum",
			"Bazuso",
			"Obskiur",
			"sand_witch",
			"mottwww",
			"Inspecta",
		],

		"Shiraitodai": [
			"amegumo",
			"Kingdomfreak",
			"michaelao",
			"BULKVANDERHUGE",
			"Zeon_Ace",
			"Rimu",
			"Betty",
			"Hambo",
			"RisingBob",
			"Fire",
			"Barranco",
			"Tilemagician",
			"Honhon",
			"lain",
			"S496",
			"UncleMoton",
			"ZZZ",
			"(((caillou)))",
		],

		"Senriyama": [
			"Meido",
			"Kress",
			"Maria33",
			"guano",
			"hierarch",
			"Sjaalman",
			"lunaslicethm",
			"BOOMER",
			"PagatUltimo",
			"ExelionBuster",
			"Soupman",
			"TanyaoGOD",
			"24601",
			"Gorona",
			"Resko",
			"NullProphet",
			"RipVanWenkle",
			"BKot23",
		],

		"Shindouji" :[
			"Sticky",
			"生意気な猫",
			"bob1444",
			"cecily",
			"MayoGirl",
			"Waifu",
			"Whaler",
			"Elahrairah",
			"saiai",
			"rigged",
			"Kirk",
			"aruchomu",
			"Boots",
			"SparrowSkull",
			"CrazyWafel",
			"peepeemonster",
			"FurudoErika",
			"philzin",
			"YOUMU!!",
		],

		"Kiyosumi": [
			"Patriarkatet",
			"snacks",
			"kfarwell",
			"Zeon_Ace",
			"S496",
			"Nekovic",
			"lunaslicethm",
			"Hambo",
			"RisingBob",
			"Fire",
			"rigged",
			"ExelionBuster",
			"Fenryl",
			"Resko",
			"SparrowSkull",
			"Obskiur",
			"sand_witch",
			"BKot23",
		],

		"Eisui": [
			"Kingdomfreak",
			"可愛い_Agro",
			"michaelao",
			"NullProphet",
			"nyagger",
			"Betty",
			"hierarch",
			"YAM",
			"PagatUltimo",
			"Sanyap",
			"Barranco",
			"Gorona",
			"ワハハ",
			"fhum",
			"Bazuso",
			"dorksport",
			"RipVanWenkle",
			"mottwww",
			"Inspecta",
			"YOUMU!!",
		],

		"Miyamori": [
			"Sticky",
			"生意気な猫",
			"6k5e",
			"bob1444",
			"Maria33",
			"MayoGirl",
			"dumbanon",
			"Whaler",
			"Elahrairah",
			"saiai",
			"Kirk",
			"TanyaoGOD",
			"Boots",
			"Honhon",
			"lain",
			"peepeemonster",
			"ZZZ",
			"philzin",
		],

		"Himematsu": [
			"spinach",
			"BULKVANDERHUGE",
			"Kress",
			"Rimu",
			"cecily",
			"guano",
			"Sjaalman",
			"Waifu",
			"BOOMER",
			"Soupman",
			"aruchomu",
			"Geh",
			"Tilemagician",
			"CrazyWafel",
			"24601",
			"UncleMoton",
			"FurudoErika",
			"(((caillou)))",
		]
	},
	"635236": {
		"Ryuumonbuchi": [
			"hierarch",
			"spinach",
			"michaelao",
			"BULKVANDERHUGE",
			"Obskiur",
			"Seanchovy",
			"Sticky",
			"XSA",
			"cecily",
			"kodomo",
			"Watapon",
			"crackhead",
			"guano",
			"quququququ",
			"Bodhi",
			"dorksport",
		],
		"Kiyosumi": [
			"Patriarkatet",
			"amegumo",
			"Fire",
			"snacks",
			"ChickenDinner",
			"Meido",
			"Toraaa",
			"bakasenpai",
			"Kirk",
			"socculta",
			"ZZZ",
			"Zeon_Ace",
			"Soupman",
			"NullProphet",
			"B_Reveler",
			"Raivoli",
			"rigged",
		],
		"Kazekoshi": [
			"生意気な猫",
			"RisingBob",
			"UncleMoton",
			"Waifu",
			"6k5e",
			"sand_witch",
			"ChihiroFJ",
			"Bodoque",
			"(((caillou)))",
			"Tarkus",
			"Kingdomfreak",
			"LucMagnus",
			"mottwww",
			"24601",
		],
		"Tsuruga": [
			"Kress",
			"MrPotato",
			"GG_to_all",
			"Garden",
			"UNIVERSE",
			"CrazyWafel",
			"bob1444",
			"Clinton_Emails",
			"Maria33",
			"Nuxoz",
			"FurudoErika",
			"theo",
			"地獄の砂",
			"Meduchi",
			"Gorona",
		]
	}
}

const nameofFactory = <T>() => (name: keyof T) => name;
const nameofContest = nameofFactory<store.Contest<ObjectId>>();

const seededPlayerNames: Record<string, string[]> = {
	"236728": [
		"Patriarkatet",
		"snacks",
		"Meido",
		"amegumo",
	]
}

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
		this.app.use(express.json({limit: "1MB"}));

		this.app.get<any, store.Contest<ObjectId>[]>('/contests', (req, res) => {
			this.mongoStore.contestCollection
				.find()
				.project({
					majsoulFriendlyId: true,
					name: true
				})
				.toArray()
				.then(contests => res.send(contests))
				.catch(error => res.status(500).send(error));
		});

		this.app.get<any, store.Contest<ObjectId>>('/contests/latest', (req, res) => {
			this.mongoStore.contestCollection
				.find()
				.sort({_id:-1})
				.limit(1)
				.project({
					sessions: 0
				})
				.toArray()
				.then(contests => res.send(contests[0]))
				.catch(error => res.status(500).send(error));
		});

		this.app.get<any, store.Contest<ObjectId>>('/contests/:id', (req, res) => {
			this.findContest(req.params.id,
				{
					projection: {
						sessions: 0
					}
				}
			).then((contest) => {
				if (contest === null) {
					res.status(404).send();
					return;
				}
				res.send(contest);
			})
			.catch(error => {
				console.log(error);
				res.status(500).send(error)
			});
		});

		this.app.get<any, Session<ObjectId>[]>('/contests/:id/sessions', (req, res) => {
			this.mongoStore.contestCollection.findOne(
				{ majsoulFriendlyId: parseInt(req.params.id) }
			).then((contest) => {
				if (contest == null) {
					res.sendStatus(404);
					return;
				}

				this.getSessions(contest).pipe(toArray())
					.subscribe(
						sessions => res.send(sessions),
						error => {
							console.log(error);
							res.status(500).send(error)
						}
					);
			})
			.catch(error => {
				console.log(error);
				res.status(500).send(error)
			});
		});

		this.app.get<any, store.Config<ObjectId>>('/config', (req, res) => {
			this.mongoStore.configCollection.find().toArray()
			.then((config) => {
				if (config[0] == null) {
					res.sendStatus(404);
					return;
				}
				res.send(config[0]);
			})
			.catch(error => {
				console.log(error);
				res.status(500).send(error)
			});
		});

		this.app.get<any, GameResult<ObjectId>[]>('/games', async (req, res) => {
			const filter: FilterQuery<store.GameResult<ObjectId>> = {
				$and: []
			};

			const contestIds = (req.query.contests as string)?.split(' ');
			if (contestIds) {
				const contests = await this.mongoStore.contestCollection.find(
					{ $or: [
						{ majsoulFriendlyId: { $in: contestIds.map(id => parseInt(id)) } },
						{ _id: { $in: contestIds.map(id => ObjectId.isValid(id) ? ObjectId.createFromHexString(id) : null) } },
					]}
				).toArray();

				filter.$and.push(
					{
						$or: contestIds.map(string => ({
							contestMajsoulId: { $in: contests.map(p => p.majsoulId) }
						}))
					}
				);
			}

			const sessionIds = (req.query?.sessions as string)?.split(' ');
			let sessionMap: {
				startSession: store.Session,
				endSession: store.Session
			}[] = [];
			if (sessionIds) {
				const sessions = await this.mongoStore.sessionsCollection.find({
					_id: { $in: sessionIds.map(id => new ObjectId(id)) }
				}).toArray();

				const sessionOr = [];
				for(const session of sessions) {
					let [startSession, endSession] = await this.mongoStore.sessionsCollection.find(
						{scheduledTime: {$gte: session.scheduledTime}}
					).sort({scheduledTime: 1}).limit(2).toArray();

					sessionMap.push({
						startSession,
						endSession
					});

					const end_time: Condition<number> = {
						$gte: startSession.scheduledTime
					}

					if(endSession != null) {
						end_time.$lt = endSession.scheduledTime;
					}

					sessionOr.push({end_time});
				}

				filter.$and.push({ $or: sessionOr });
			}

			if (filter.$and.length === 0) {
				delete filter.$and;
			}

			const cursor = this.mongoStore.gamesCollection.find(filter);

			if (req.query?.last) {
				const last = parseInt(req.query.last as string);
				if (last) {
					cursor.sort({end_time: -1})
					.limit(last);
				}
			}

			try {
				const games = await cursor.toArray();
				const contests = await this.mongoStore.contestCollection.find(
					{majsoulId: { $in: [...new Set(games.map(g => g.contestMajsoulId))] } }
				).toArray();

				res.send(games.map(game => ({
					...game,
					contestId: contests.find(c => c.majsoulId === game.contestMajsoulId)._id,
					sessionId: sessionMap.find((session) =>
						game.end_time >= session.startSession.scheduledTime
							&& (session.endSession == null || game.end_time < session.endSession.scheduledTime)
					)?.startSession?._id
				})));
			} catch (error) {
				console.log(error);
				res.status(500).send(error)
			}
		});

		this.app.get<any, GameResult[]>('/contests/:contestId/players/:playerId/games', async (req, res) => {
			try {
				const contest = await this.findContest(req.params.contestId);

				if (contest == null) {
					res.sendStatus(404);
					return;
				}

				const games = await this.mongoStore.gamesCollection.find(
					{
						contestMajsoulId: contest.majsoulId,
						"players._id": ObjectId.createFromHexString(req.params.playerId)
					}
				).toArray();

				res.send(games.map(game => ({
					...game,
					contestId: contest._id
				})));
			} catch (error){
				console.log(error);
				res.status(500).send(error)
			}
		});

		this.app.get<any, GameResult[]>('/contests/:contestId/yakuman', async (req, res) => {
			try {
				const contest = await this.findContest(req.params.contestId);

				if (contest == null) {
					res.sendStatus(404);
					return;
				}

				const games = await this.mongoStore.gamesCollection.find(
					{
						contestMajsoulId: contest.majsoulId,
					}
				).toArray();

				res.send(games
					.filter(game => game.rounds.find(round =>
						round.tsumo?.value === 32000
							|| round.tsumo?.value === 48000
							|| round.rons?.find(ron => ron.value === 32000 || ron.value === 48000) != null
					))
					.map(game => ({
						...game,
						contestId: contest._id
					}))
				);
			} catch (error){
				console.log(error);
				res.status(500).send(error)
			}
		});

		this.app.get<any, ContestPlayer[]>('/contests/:id/players', async (req, res) => {
			try {
				const contest = await this.findContest(req.params.id);

				if (contest == null) {
					res.sendStatus(404);
					return;
				}
				const contestMajsoulFriendlyId = contest.majsoulFriendlyId?.toString() ?? "";

				const games = await this.mongoStore.gamesCollection.find(
					{ contestMajsoulId: contest.majsoulId }
				).toArray();

				let gameLimit = parseInt(req.query?.gameLimit as string);
				if (isNaN(gameLimit)) {
					gameLimit = Infinity;
				}

				let ignoredGames = parseInt(req.query?.ignoredGames as string);
				if (isNaN(ignoredGames)) {
					ignoredGames = 0;
				}

				const playerGameInfo = games.reduce<Record<string, ContestPlayer>>((total, game) => {
					game.players.forEach((player, index) => {
						const id = player._id.toHexString();
						if (!(id in total)) {
							total[id] = {
								...player,
								tourneyScore: 0,
								tourneyRank: undefined,
								gamesPlayed: 0,
								team: undefined
							};
						}

						total[id].gamesPlayed++;
						if (total[id].gamesPlayed <= ignoredGames || total[id].gamesPlayed > (gameLimit + ignoredGames)) {
							return;
						}
						total[id].tourneyScore += game.finalScore[index].uma + (contest.bonusPerGame ?? 0);
					});
					return total;
				}, {});

				const seededPlayersForContest = seededPlayerNames[contestMajsoulFriendlyId] ?? [];

				const seededPlayers = await this.mongoStore.playersCollection.find(
					{ nickname: { $in: seededPlayersForContest } }
				).toArray();

				for (const seededPlayer of seededPlayers) {
					const id = seededPlayer._id.toHexString();
					if (id in playerGameInfo) {
						continue;
					}
					playerGameInfo[id] =  {
						...seededPlayer,
						tourneyScore: 0,
						tourneyRank: undefined,
						gamesPlayed: 0,
						team: undefined
					};
				}

				const players = await this.mongoStore.playersCollection.find(
					{ _id: { $in: Object.values(playerGameInfo).map(p => p._id) } },
					{ projection: { majsoulId: 0 } }
				).toArray();

				res.send(
					players.map(player => ({
						...playerGameInfo[player._id.toHexString()],
						...player,
						team: {
							teams: Object.entries(sakiTeams[contestMajsoulFriendlyId] ?? {})
								.filter(([team, players]) => players.indexOf(player.nickname) >= 0)
								.map(([team, _]) => team),
							seeded: seededPlayersForContest.indexOf(player.nickname) >= 0,
						}
					}))
					.filter(player => player.gamesPlayed > ignoredGames || player.team.seeded)
					.sort((a, b) => b.tourneyScore - a.tourneyScore)
					.map((p, i) => ({...p, tourneyRank: i}))
				);
			} catch (error){
				console.log(error);
				res.status(500).send(error)
			}
		});
	}

	private findContest(contestId: string, options?: FindOneOptions): Promise<store.Contest<ObjectId>> {
		return this.mongoStore.contestCollection.findOne(
			{ $or: [
				{ majsoulFriendlyId: parseInt(contestId) },
				{ _id: ObjectId.isValid(contestId) ? ObjectId.createFromHexString(contestId) : null },
			]},
			options
		);
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

		.patch<any, store.Contest<ObjectId>>(
			'/contests/:id',
			param("id").isMongoId(),
			body(nameofContest('majsoulFriendlyId')).not().isString().bail().isInt({min: 100000, lt: 1000000}).optional({nullable: true}),
			body(nameofContest('type')).not().isString().bail().isNumeric().isWhitelisted(Object.keys(store.ContestType)).optional(),
			body(nameofContest('anthem')).isString().bail().isLength({max: 50}).optional({nullable: true}),
			body(nameofContest('tagline')).isString().bail().isLength({max: 200}).optional({nullable: true}),
			body(nameofContest('taglineAlternate')).isString().bail().isLength({max: 200}).optional({nullable: true}),
			body(nameofContest('displayName')).isString().bail().isLength({max: 100}).optional({nullable: true}),
			body(nameofContest('maxGames')).not().isString().bail().isInt({gt: 0, max: 50}).optional({nullable: true}),
			body(nameofContest('bonusPerGame')).not().isString().bail().isInt({min: 0}).optional({nullable: true}),
			async (req, res) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() } as any);
				}
				const update: {
					$set?: {},
					$unset?: {},
				} = {};
				const data: Partial<store.Contest<string>> = matchedData(req, {includeOptionals: true});

				if (data.majsoulFriendlyId != null) {
					try {
						const existingGame = await this.mongoStore.contestCollection.findOne({majsoulFriendlyId: data.majsoulFriendlyId});
						if (existingGame != null && !existingGame._id.equals(data._id)) {
							res.status(400).send(`Contest #${existingGame._id.toHexString()} already subscribed to majsoul ID ${data.majsoulFriendlyId}` as any);
							return;
						};
					} catch (e) {
						res.status(500).send(e);
						return;
					}
				}

				for (const key in data) {
					if (key === "id") {
						continue;
					}

					if (data[key] === undefined) {
						continue;
					}

					if (key === nameofContest("majsoulFriendlyId")) {
						update.$unset ??= {};
						update.$unset[nameofContest("notFoundOnMajsoul")] = true;
					}

					if (data[key] === null) {
						update.$unset ??= {};
						update.$unset[key] = true;
						continue;
					}

					update.$set ??= {};
					update.$set[key] = data[key];
				}

				this.mongoStore.contestCollection.findOneAndUpdate(
					{ _id: new ObjectId(req.params.id) },
					update,
					{
						returnOriginal: false,
						projection: {
							teams: false,
							sessions: false,
						}
					}
				).then((contest) => {
					if (contest.value === null) {
						res.status(404).send();
						return;
					}
					res.send(contest.value);
				}).catch((err) => {
					console.log(err);
					res.status(500).send(err);
				})
			}
		)

		.put<any, store.Contest<string>>('/contests', (req, res) => {
			this.mongoStore.contestCollection.insertOne({}).then(result => res.send({ _id: result.insertedId.toHexString() }));
		})

		.delete<any, store.Contest<string>>(
			'/contests/:id',
			param("id").isMongoId(),
			(req, res) => {
				this.mongoStore.contestCollection.deleteOne({
					_id: new ObjectId(req.params.id)
				}).then(_ => res.send())
				.catch(error => res.status(500).send(error));
			}
		)

		.patch<any, Session<ObjectId>>('/sessions/:id', (req, res) => {
			const patch = req.body as Session<string>;
			if (patch?.scheduledTime == undefined) {
				res.sendStatus(304);
				return;
			}

			this.mongoStore.sessionsCollection.findOneAndUpdate(
				{ _id: new ObjectId(req.params.id) },
				{ $set: { scheduledTime: patch.scheduledTime }},
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

		.patch<any, store.ContestTeam<ObjectId>>('/teams/:id', (req, res) => {
			const body = req.body as store.ContestTeam<string>;

			if (body.image == undefined && body.anthem == undefined) {
				res.sendStatus(304);
				return;
			}

			const teamId = new ObjectId(req.params.id);

			this.mongoStore.contestCollection.findOneAndUpdate(
				{ teams: { $elemMatch: { _id: teamId } } },
				{ $set: {
					"teams.$.image": body.image,
					"teams.$.anthem": body.anthem
				} },
				{ returnOriginal: false, projection: { teams: true } }
			).then((contest) => {
				res.send(contest.value.teams.find(team => team._id.equals(teamId) ));
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

	private getSessions(contest: store.Contest<ObjectId>): Observable<Session> {
		return new Observable((subscriber) => {
			setTimeout(async () => {
				try {
					const sessions = await this.mongoStore.sessionsCollection.find(
						{ contestId: contest._id },
						{ sort: { scheduledTime: 1 } }
					).toArray();

					let aggregateTotals: Record<string, number> = {};
					for (let i = 0; i < sessions.length; i++) {
						aggregateTotals = {...aggregateTotals};
						const totals = await this.getSessionSummary(contest, sessions[i], sessions[i + 1]);

						for (const team in totals) {
							if (aggregateTotals[team] == null) {
								aggregateTotals[team] = 0;
							}
							aggregateTotals[team] += totals[team];
						}

						subscriber.next({
							...sessions[i],
							totals,
							aggregateTotals
						});
					}

					subscriber.complete();
				} catch (error) {
					subscriber.error(error);
				}
			});
		});
	}
}
