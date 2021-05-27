import * as express from 'express';
import * as cors from "cors";
import * as store from '../store';
import { GameResult, Session, ContestPlayer } from './types/types';
import { ObjectId, FilterQuery, Condition, FindOneOptions } from 'mongodb';
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import * as expressJwt from 'express-jwt';
import { concat, defer, from, Observable, of } from 'rxjs';
import { map, mergeAll, mergeScan, pairwise, toArray } from 'rxjs/operators';
import { body, matchedData, oneOf, param, query, validationResult } from 'express-validator';
import { Store } from '..';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getSecrets } from '../secrets';
import { latestStatsVersion, StatsVersion } from './types/stats/StatsVersion';
import { Stats } from './types/stats';
import { collectStats } from './stats/collectStats';
import { mergeStats } from './stats/mergeStats';
import { logError } from './utils.ts/logError';
import { withData } from './utils.ts/withData';
import { minimumVersion } from './stats/minimumVersion';
import { escapeRegexp } from './utils.ts/escapeRegexp';

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
const nameofPlayer = nameofFactory<store.Player<ObjectId>>();
const nameofConfig = nameofFactory<store.Config<ObjectId>>();
const nameofTeam = nameofFactory<store.ContestTeam<ObjectId>>();
const nameofSession = nameofFactory<store.Session<ObjectId>>();
const nameofGameResult = nameofFactory<store.GameResult<ObjectId>>();

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

	private oauth2Client: OAuth2Client;

	constructor(private readonly mongoStore: store.Store) {
		this.app = express();
		this.app.use(cors());
		this.app.use(express.json({limit: "1MB"}));

		this.app.get<any, store.Contest<ObjectId>[]>('/contests', (req, res) => {
			this.mongoStore.contestCollection
				.find()
				.project({
					majsoulFriendlyId: true,
					name: true,
					displayName: true,
				})
				.toArray()
				.then(contests => res.send(contests))
				.catch(error => res.status(500).send(error));
		});

		this.app.get<any, store.Contest<ObjectId>>('/contests/featured', logError(async (req, res) => {
			const [config] = await this.mongoStore.configCollection.find()
				.project({
					googleRefreshToken: false
				}).limit(1)
				.toArray();
			const query: FilterQuery<store.Contest<ObjectId>> = {};
			if (config.featuredContest != null) {
				query._id = config.featuredContest;
			}

			this.mongoStore.contestCollection
				.find(query)
				.sort({_id:-1})
				.limit(1)
				.project({
					_id: true
				})
				.toArray()
				.then(contests => res.send(contests[0]))
				.catch(error => res.status(500).send(error));
		}));

		this.app.get<any, store.Contest<ObjectId>>('/contests/:id', (req, res) => {
			this.findContest(req.params.id).then((contest) => {
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

		this.app.get('/contests/:id/images',
			param("id").isMongoId(),
			withData<{id: string}, any, store.Contest<ObjectId>>(async (data, req, res) => {
			 const contest = await this.findContest(data.id, {
				projection: {
					_id: true,
					"teams._id": true,
					"teams.image": true
				}
			});

			if (contest === null) {
				res.status(404).send();
				return;
			}

			res.send(contest);
		}));

		this.app.get<any, store.GameResult<ObjectId>>('/games/:id',
			param("id").isMongoId(),
			withData<{id: string}, any, store.GameResult<ObjectId>>(async (data, req, res) => {
				const gameId = new ObjectId(data.id);
				const games = await this.mongoStore.gamesCollection.find({
					_id: gameId
				}).toArray();

				if (games.length < 1) {
					res.status(404).send();
					return;
				}
				res.send(games[0]);
			})
		)

		this.app.get('/contests/:id/pendingGames',
			param("id").isMongoId(),
			withData<{id: string}, any, store.GameResult<ObjectId>[]>(async (data, req, res) => {
				const games = await this.mongoStore.gamesCollection.find({
					contestId: new ObjectId(data.id),
					notFoundOnMajsoul: { $ne: false },
					contestMajsoulId: { $exists: false }
				}).toArray();
				res.send(games);
			})
		)

		this.app.get('/contests/:id/sessions',
			param("id").isMongoId(),
			withData<{id: string}, any, Session<ObjectId>[]>(async (data, req, res) => {
				const contest = await this.findContest(data.id, {
					projection: {
						_id: true,
						'teams._id': true,
						'teams.players._id': true,
					}
				});
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
		);

		this.app.get<any, store.Config<ObjectId>>('/config', (req, res) => {
			this.mongoStore.configCollection.find()
			.project({
				googleRefreshToken: false
			}).toArray()
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
				$and: [{
					$or: [
						{
							notFoundOnMajsoul: false,
						},
						{
							contestMajsoulId: { $exists: true },
						}
					]
				}]
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
							contestId: { $in: contests.map(p => p._id) }
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

			cursor.project({
				rounds: false,
			});

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
				const contestId = await this.contestExists(req.params.contestId);
				if (!contestId) {
					res.sendStatus(404);
					return;
				}

				const games = await this.mongoStore.gamesCollection.find(
					{
						contestId: contestId,
						$or: [
							{ notFoundOnMajsoul: false },
							{ contestMajsoulId: { $exists: true } }
						],
						"players._id": ObjectId.createFromHexString(req.params.playerId)
					}
				).toArray();

				res.send(games.map(game => ({
					...game,
					contestId: contestId
				})));
			} catch (error){
				console.log(error);
				res.status(500).send(error)
			}
		});

		this.app.get<any, GameResult[]>('/contests/:contestId/yakuman', async (req, res) => {
			try {
				const contestId = await this.contestExists(req.params.contestId);
				if (!contestId) {
					res.sendStatus(404);
					return;
				}

				const games = await this.mongoStore.gamesCollection.find(
					{
						contestId: contestId,
						$or: [
							{ notFoundOnMajsoul: false },
							{ contestMajsoulId: { $exists: true } }
						],
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
						contestId: contestId
					}))
				);
			} catch (error){
				console.log(error);
				res.status(500).send(error)
			}
		});

		this.app.get('/contests/:id/players',
			param("id").isMongoId(),
			query("gameLimit").isInt({min: 0}).optional(),
			query("ignoredGames").isInt({min: 0}).optional(),
			query("teamId").isMongoId().optional(),
			withData<{
				id: string;
				teamId?: string;
				gameLimit?: string;
				ignoredGames?: string;
			}, any, ContestPlayer[]>(async (data, req, res) => {
				const contest = await this.findContest(data.id, {
					projection: {
						_id: true,
						'teams._id': true,
						'teams.players._id': true,
						majsoulFriendlyId: true,
						bonusPerGame: true,
					}
				});

				if (contest == null) {
					res.sendStatus(404);
					return;
				}

				const contestMajsoulFriendlyId = contest.majsoulFriendlyId?.toString() ?? "";

				const team = data.teamId && contest.teams.find(team => team._id.equals(data.teamId));
				if (data.teamId && !team) {
					res.status(400).send(`Team ${data.teamId} doesn't exist` as any);
					return;
				}

				const playerIds = team?.players?.map(player => player._id) ?? [];

				const gameQuery: FilterQuery<store.GameResult<ObjectId>> = {
					contestId: contest._id,
					$or: [
						{ notFoundOnMajsoul: false },
						{ contestMajsoulId: { $exists: true } }
					],
				}

				if (data.teamId) {
					gameQuery["players._id"] = {
						$in: playerIds
					}
				}

				const games = await this.mongoStore.gamesCollection.find(
					gameQuery
				).toArray();

				let gameLimit = parseInt(data.gameLimit);
				if (isNaN(gameLimit)) {
					gameLimit = Infinity;
				}

				let ignoredGames = parseInt(data.ignoredGames);
				if (isNaN(ignoredGames)) {
					ignoredGames = 0;
				}

				const playerGameInfo = games.reduce<Record<string, ContestPlayer>>((total, game) => {
					game.players.forEach((player, index) => {
						if (player == null) {
							return;
						}

						if (data.teamId && !playerIds.find(id => id.equals(player._id))) {
							return;
						}

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
					{ _id: { $in: Object.values(playerGameInfo).map(p => p._id).concat(playerIds) } },
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
					.filter(player => ignoredGames == 0 || player.gamesPlayed > ignoredGames || player.team.seeded)
					.sort((a, b) => b.tourneyScore - a.tourneyScore)
					.map((p, i) => ({...p, tourneyRank: i}))
				);
		}));

		this.app.get('/contests/:id/stats',
			param("id").isMongoId(),
			oneOf([
				query("team").isMongoId(),
				query("player").isMongoId(),
				query("players").isEmpty(),
			]),
			withData<{
				id?: string;
				team?: string;
				player?: string;
				players?: "";
			}, any, Record<string, Stats>>(async (data, req, res) => {
				const contest = await this.findContest(data.id);
				if (!contest) {
					res.sendStatus(404);
					return;
				}

				if ([data.team, data.player, data.players].filter(option => option != null).length !== 1) {
					res.status(401).send("Only one query allowed at a time." as any);
					return;
				}

				const query: FilterQuery<Store.GameResult<ObjectId>> = {
					contestId: contest._id,
				};

				let playerMap: Record<string, ObjectId | boolean> = null;

				if (data.team) {
					const teamId = new ObjectId(data.team);
					const team = contest.teams.find(team => team._id.equals(teamId));
					if (team == null) {
						res.status(401).send(`Team #${teamId} not found` as any);
						return;
					}

					playerMap = team.players.reduce((total, next) => (total[next._id.toHexString()] = teamId, total) , {} as Record<string, ObjectId | boolean>)
				} else if (data.player != null) {
					const playerId = new ObjectId(data.player);
					const [ player ] = await this.mongoStore.playersCollection.find({
						_id: playerId
					}).toArray();

					if (player === null) {
						res.status(401).send(`Player #${playerId} not found!` as any);
						return;
					}

					playerMap = {
						[data.player]: true
					}
				}

				if (playerMap) {
					query.players = {
						$elemMatch: {
							_id: {
								$in: Object.keys(playerMap).map(ObjectId.createFromHexString)
							}
						}
					}
				}

				const games = await this.mongoStore.gamesCollection.find(query).toArray();
				const commonVersion = games.reduce((total, next) => Math.min(total, minimumVersion(next)) as StatsVersion, latestStatsVersion)
				const gameStats = games.map(game => collectStats(game, commonVersion, playerMap));

				if (data.team != null) {
					res.send({
						[data.team]: mergeStats(gameStats.flat(), commonVersion)
					});
					return;
				}

				const gamesByPlayer = gameStats.reduce((total, next) => {
					for (const stats of next) {
						const id = stats.playerId.toHexString();
						total[id] ??= [];
						total[id].push(stats);
					}
					return total;
				}, {} as Record<string, Stats[]>);

				res.send(Object.entries(gamesByPlayer).reduce((total, [key, value]) => (total[key] = mergeStats(value, commonVersion), total), {}));
			})
		);

		this.app.get('/players',
			query("name").optional(),
			query("limit").isInt({gt: 0}).optional(),
			withData<{
				name?: string;
				limit?: string;
			}, any, store.Player<ObjectId>[]>(async (data, req, res) => {
				const regex = new RegExp(`^${escapeRegexp(data.name)}.*$`);
				const cursor = this.mongoStore.playersCollection.find(
					{
						$or: [
							{
								displayName: { $regex: regex, $options: "i" }
							},
							{
								nickname: { $regex: regex, $options: "i" }
							}
						],
					},
					{
						projection: {
							_id: true,
							nickname: true,
							displayName: true,
						},
						sort: {
							nickname: 1,
						}
					}
				)

				if (data.limit) {
					cursor.limit(parseInt(data.limit))
				}

				res.send(await cursor.toArray());
			})
		);
	}

	private findContest(contestId: string, options?: FindOneOptions): Promise<store.Contest<ObjectId>> {
		return this.mongoStore.contestCollection.findOne(
			{ $or: [
				{ majsoulFriendlyId: parseInt(contestId) },
				{ _id: ObjectId.isValid(contestId) ? ObjectId.createFromHexString(contestId) : null },
			]},
			options ?? {
				projection: {
					'teams.image': false,
					sessions: false,
				}
			}
		);
	}

	private contestExists(contestId: string): Promise<ObjectId> {
		return this.findContest(contestId, { projection: { _id: true }}).then(contest => contest?._id);
	}

	public async init(root: {username: string, password: string}) {
		const secrets = getSecrets();
		this.oauth2Client = new google.auth.OAuth2(
			secrets.google.clientId,
			secrets.google.clientSecret,
			`${process.env.NODE_ENV === "production" ? "https": `http`}://${process.env.NODE_ENV === "production" ? "riichi.moe": `localhost:8080`}/rigging/google`
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

		.get('/rigging/google',
			query("state").optional(),
			withData<{state?: string}, any, { authUrl: string }>(async (data, req, res) => {
				const authUrl = this.oauth2Client.generateAuthUrl({
					access_type: 'offline',
					scope: [
						'https://www.googleapis.com/auth/spreadsheets'
					],
					state: data.state
				});
				res.send({
					authUrl
				})
			})
		)

		.patch('/rigging/google',
			body("code").isString().isLength({min: 1}),
			withData<{code: string}, any, void>(async (data, req, res) => {
				const { tokens } = await this.oauth2Client.getToken(data.code);
				this.mongoStore.configCollection.updateMany({}, {
					$set: {
						googleRefreshToken: tokens.refresh_token
					}
				})
				res.send();
			})
		)

		.patch<any, store.Contest<ObjectId>>('/contests/:id',
			param("id").isMongoId(),
			body(nameofContest('majsoulFriendlyId')).not().isString().bail().isInt({min: 100000, lt: 1000000}).optional({nullable: true}),
			body(nameofContest('type')).not().isString().bail().isNumeric().isWhitelisted(Object.keys(store.ContestType)).optional(),
			body(nameofContest('anthem')).isString().bail().isLength({max: 50}).optional({nullable: true}),
			body(nameofContest('spreadsheetId')).isString().bail().optional({nullable: true}),
			body(nameofContest('tagline')).isString().bail().isLength({max: 200}).optional({nullable: true}),
			body(nameofContest('taglineAlternate')).isString().bail().isLength({max: 200}).optional({nullable: true}),
			body(nameofContest('displayName')).isString().bail().isLength({max: 100}).optional({nullable: true}),
			body(nameofContest('maxGames')).not().isString().bail().isInt({gt: 0, max: 50}).optional({nullable: true}),
			body(nameofContest('bonusPerGame')).not().isString().bail().isInt({min: 0}).optional({nullable: true}),
			body(nameofContest('track')).not().isString().bail().isBoolean().optional({nullable: true}),
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

				if (update.$set == null && update.$unset == null) {
					res.status(400).send("No operations requested" as any);
					return;
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

		.put<any, string>('/games',
			body(nameofGameResult('contestId')).isMongoId().isString(),
			body(nameofGameResult('majsoulId')).isString(),
			logError<any, string>(
				async (req, res) => {
					const errors = validationResult(req);
					if (!errors.isEmpty()) {
						res.status(400).json({ errors: errors.array() } as any);
						return;
					}
					const data: Partial<store.GameResult<string>> = matchedData(req, {includeOptionals: true});
					const contestId = new ObjectId(data.contestId);
					const existingContest = await this.mongoStore.contestCollection.find({_id: contestId}).toArray();
					if (existingContest.length <= 0) {
						res.status(400).send("Contest Id is invalid." as any);
						return;
					}

					const existingGame = await this.mongoStore.gamesCollection.find({majsoulId: data.majsoulId}).toArray();

					if (existingGame.length > 0) {
						res.status(400).send(`Game with id ${data.majsoulId} already exists.` as any);
						return;
					}

					const gameResult = await this.mongoStore.gamesCollection.insertOne({
						contestId,
						majsoulId: data.majsoulId
					});

					res.send(JSON.stringify(gameResult.insertedId.toHexString()));
				}
			)
		)

		.delete<any, void>('/games/:id',
			param("id").isMongoId(),
			logError(async (req, res) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					res.status(400).json({ errors: errors.array() } as any);
					return;
				}
				const data = matchedData(req, {includeOptionals: true}) as { id: string; };
				const gameId = new ObjectId(data.id);

				const result = await this.mongoStore.gamesCollection.deleteOne({
					_id: gameId
				})

				res.send();
			})
		)

		.put<any, store.Contest<string>>('/contests', (req, res) => {
			this.mongoStore.contestCollection.insertOne({}).then(result => res.send({ _id: result.insertedId.toHexString() }));
		})

		.delete<any, void>('/contests/:id',
			param("id").isMongoId(),
			logError(async (req, res) => {
				const errors = validationResult(req);
				if (!errors.isEmpty()) {
					res.status(400).json({ errors: errors.array() } as any);
					return;
				}

				const data: Partial<store.Contest<string>> = matchedData(req, {includeOptionals: true});
				const contestId = new ObjectId(data._id);

				await this.mongoStore.configCollection.findOneAndUpdate(
					{ featuredContest: contestId },
					{ $unset: {featuredContest: true }
				});

				const result = await this.mongoStore.contestCollection.deleteOne({
					_id: contestId
				})

				await this.mongoStore.configCollection.findOneAndUpdate({
					trackedContest: contestId
				}, {
					$unset: {
						trackedContest: true
					}
				})

				res.send();
			})
		)

		.patch<any, store.Config<ObjectId>>('/config',
			body(nameofConfig('featuredContest')).isMongoId().optional({nullable: true}),
			withData<Partial<store.Config<string>>, any, store.Config<ObjectId>>(async (data, req, res) => {
				if (data.featuredContest != null) {
					const existingContest = await this.mongoStore.contestCollection.findOne({_id: new ObjectId(data.featuredContest)});
					if (existingContest == null) {
						res.status(400).send(`Featured contest #${data._id} doesn't exist.` as any);
						return;
					};
				}

				const update: {
					$set?: {},
					$unset?: {},
				} = {};

				for (const key in data) {
					if (data[key] === undefined) {
						continue;
					}

					if (data[key] === null) {
						update.$unset ??= {};
						update.$unset[key] = true;
						continue;
					}

					update.$set ??= {};
					update.$set[key] = key === nameofConfig("featuredContest") ? new ObjectId(data[key] as string) : data[key];
				}

				if (update.$set == null && update.$unset == null) {
					res.status(400).send("No operations requested" as any);
					return;
				}

				const [existingConfig] = await this.mongoStore.configCollection.find().toArray();
				if (existingConfig == null) {
					res.status(404).send();
					return;
				}

				const updatedConfig = await this.mongoStore.configCollection.findOneAndUpdate(
					{ _id: existingConfig._id },
					update,
					{
						returnOriginal: false,
						projection: {
							googleRefreshToken: false
						}
					}
				);

				if (updatedConfig.value === null) {
					res.status(404).send();
					return;
				}
				res.send(updatedConfig.value);
			})
		)

		.put('/sessions',
			body(nameofSession("contestId")).isMongoId(),
			withData<Partial<store.Session<string | ObjectId>>, any, store.Session<ObjectId>>(async (data, req, res) => {
				const contestId =  await this.contestExists(data.contestId as string);
				if (!contestId) {
					res.status(400).send(`contest #${data.contestId} not found` as any);
					return;
				}

				const [lastSession] = await this.mongoStore.sessionsCollection
					.find()
					.sort(nameofSession("scheduledTime"), -1)
					.limit(1)
					.toArray();

				const session = await this.mongoStore.sessionsCollection.insertOne(
					{
						scheduledTime: (lastSession?.scheduledTime ?? Date.now()) + (24 * 60 * 60 * 1000),
						contestId,
						plannedMatches: [],
					},
				);

				res.send(session.ops[0]);
			})
		)

		.patch('/sessions/:id',
			param("id").isMongoId(),
			body(nameofSession("scheduledTime")).not().isString().bail().isInt({min: 0}).optional(),
			body(nameofSession("name")).isString().optional({nullable: true}),
			body(nameofSession("isCancelled")).not().isString().bail().isBoolean().optional({nullable: true}),
			body(nameofSession("plannedMatches")).not().isString().bail().isArray().optional(),
			body(`${nameofSession("plannedMatches")}.*.teams`).not().isString().bail().isArray({max:4, min:4}),
			body(`${nameofSession("plannedMatches")}.*.teams.*._id`).isMongoId(),
			withData<{
				id: string;
			} & Partial<store.Session<string | ObjectId>>, any, store.Session<ObjectId>>(async (data, req, res) => {
				if (data.plannedMatches && data.plannedMatches.length > 0) {
					const teamIds = data.plannedMatches.map(match => match.teams.map(team => team._id as string)).flat();
					const uniqueTeams = new Set(teamIds.map(id => id));

					if (uniqueTeams.size !== teamIds.length) {
						res.status(400).send("Teams cannot be in two matches at once!" as any);
						return;
					}

					data.plannedMatches = data.plannedMatches.map(match => ({
						teams: match.teams.map(team => ({
							_id: new ObjectId(team._id)
						}))
					}));

					const sessionId = new ObjectId(data.id);

					const [session] = await this.mongoStore.sessionsCollection.find({
						_id: sessionId
					}).toArray();

					if (!session) {
						res.status(404).send();
						return;
					}

					const [contest] = await this.mongoStore.contestCollection.find({
						_id: session.contestId,
						"teams._id": {
							$all: teamIds.map(id => new ObjectId(id))
						}
					}).toArray();

					if (!contest) {
						res.status(400).send(`One of team ids ${teamIds.map(id => `#${id}`).join(", ")} doesn't exist.` as any);
						return;
					}
				}

				const update: {
					$set?: {},
					$unset?: {},
				} = {};

				for (const key in data) {
					if (key === "id") {
						continue;
					}

					if (data[key] === undefined) {
						continue;
					}

					if (data[key] === null) {
						update.$unset ??= {};
						update.$unset[key] = true;
						continue;
					}

					update.$set ??= {};
					update.$set[key] = data[key];
				}

				if (update.$set == null && update.$unset == null) {
					res.status(400).send("No operations requested" as any);
					return;
				}

				const session = await this.mongoStore.sessionsCollection.findOneAndUpdate(
					{ _id: new ObjectId(data.id) },
					update,
					{
						returnOriginal: false,

					}
				);

				if (!session.value) {
					res.status(404).send();
					return;
				}

				res.send(session.value);
			})
		)

		.delete('/sessions/:id',
			param("id").isMongoId(),
			withData<{id: string}, any, store.Session<ObjectId>>(async (data, req, res) => {
				const result = await this.mongoStore.sessionsCollection.deleteOne(
					{
						_id: new ObjectId(data.id)
					}
				);

				if (result.deletedCount <= 0) {
					res.sendStatus(404);
				}
				res.send();
			})
		)

		.patch('/contests/:id/teams/:teamId',
			param("id").isMongoId(),
			param("teamId").isMongoId(),
			body(nameofTeam('image')).isString().optional({nullable: true}),
			body(nameofTeam('name')).isString().optional({nullable: true}),
			body(nameofTeam('players')).isArray().optional(),
			body(`${nameofTeam('players')}.*._id`).isMongoId(),
			body(nameofTeam('anthem')).isString().optional({nullable: true}),
			body(nameofTeam('color')).isString().matches(/^([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).optional({nullable: true}),
			withData<
				{
					id: string;
					teamId: string;
				} & Partial<store.ContestTeam<ObjectId | string>>,
				any,
				store.ContestTeam<ObjectId>
			>(async (data, req, res) => {
				const update: {
					$set?: {},
					$unset?: {},
				} = {};

				const id = new ObjectId(data.id);
				const teamId = new ObjectId(data.teamId);

				if (data.players) {
					for (const player of data.players) {
						player._id = new ObjectId(player._id);
					}
					const players = await this.mongoStore.playersCollection.find({
						_id: {$in: data.players.map(player => player._id as ObjectId)}
					}).toArray();
					if (players.length !== data.players.length) {
						res.status(400).send(
							`Players ${data.players
								.filter(player => !players.find(p => p._id.equals(player._id)))
								.map(player => `#${player._id}`)
								.join(", ")
							} not found.` as any
						);
						return;
					}
				}

				for (const key in data) {
					if (data[key] === undefined) {
						continue;
					}

					if (key === "id" || key === "teamId") {
						continue;
					}

					const updateKey = `teams.$.${key}`;

					if (data[key] === null) {
						update.$unset ??= {};
						update.$unset[updateKey] = true;
						continue;
					}

					update.$set ??= {};
					update.$set[updateKey] = data[key];
				}

				if (update.$set == null && update.$unset == null) {
					res.status(400).send("No operations requested" as any);
					return;
				}

				this.mongoStore.contestCollection.findOneAndUpdate(
					{
						_id: id,
						teams: { $elemMatch: { _id: teamId } }
					},
					update,
					{ returnOriginal: false, projection: { teams: true } }
				).then((contest) => {
					res.send(contest.value.teams.find(team => team._id.equals(teamId) ));
				}).catch((err) => {
					console.log(err);
					res.status(500).send(err);
				})
			}
		))

		.put('/contests/:id/teams/',
			param("id").isMongoId(),
			withData<
				{
					id: string;
				},
				any,
				store.ContestTeam<ObjectId>
			>(async (data, req, res) => {
				const contestId = await this.contestExists(data.id);
				if (!contestId) {
					res.sendStatus(404);
					return;
				}

				const team = {
					_id: new ObjectId()
				};

				await this.mongoStore.contestCollection.findOneAndUpdate(
					{
						_id: contestId,
					},
					{
						$push: {
							teams: team
						}
					},
					{ returnOriginal: false, projection: { teams: true } }
				)

				res.send(team);
			}
		))

		.delete('/contests/:id/teams/:teamId',
			param("id").isMongoId(),
			param("teamId").isMongoId(),
			withData<
				{
					id: string;
					teamId: string;
				},
				any,
				store.ContestTeam<ObjectId>
			>(async (data, req, res) => {
				const [contest] = await this.mongoStore.contestCollection.find(
					{
						_id: new ObjectId(data.id),
						teams: { $elemMatch: { _id: new ObjectId(data.teamId) } }
					},
				).toArray();

				if (contest == null) {
					res.sendStatus(404);
					return;
				}

				const teamId = new ObjectId(data.teamId);

				await this.mongoStore.contestCollection.findOneAndUpdate(
					{
						_id: contest._id,
					},
					{
						$pull: {
							teams: {
								_id: teamId
							}
						}
					},
					{ returnOriginal: false, projection: { teams: true } }
				)

				res.send();
			}
		))

		.put('/players/',
			body(nameofPlayer("majsoulFriendlyId")).not().isString().bail().isNumeric(),
			withData<Partial<store.Player<string | ObjectId>>, any, Store.Player<ObjectId>>(async (data, req, res) => {
				const result = await this.mongoStore.playersCollection.insertOne({
					majsoulFriendlyId: data.majsoulFriendlyId
				});
				res.send(result.ops[0]);
			})
		)

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
			contestId: contest._id,
			end_time: timeWindow
		}).toArray();

		return games.reduce<Record<string, number>>((total, game) => {
			game.finalScore.forEach((score, index) => {
				const winningTeam = contest.teams.find(t => t.players?.find(p => p._id.equals(game.players[index]._id)));
				if (!winningTeam) {
					return;
				}
				total[winningTeam._id.toHexString()] = (total[winningTeam._id.toHexString()] ?? 0) + score.uma;
			});
			return total;
		}, contest.teams.reduce((total, next) => (total[next._id.toHexString()] = 0, total), {}));
	}

	private getSessions(contest: store.Contest<ObjectId>): Observable<Session> {
		return concat(
			defer(() => from(
				this.mongoStore.sessionsCollection.find(
					{ contestId: contest._id },
					{ sort: { scheduledTime: 1 } }
				).toArray()
			)).pipe(
				mergeAll(),
			),
			of<store.Session<ObjectId>>(null)
		).pipe(
			pairwise(),
			mergeScan((total, [session, nextSession]) =>
				defer(() => from(this.getSessionSummary(contest, session, nextSession)))
					.pipe(
						map(totals => {
							const aggregateTotals = {...total.aggregateTotals};

							for (const team in totals) {
								if (aggregateTotals[team] == null) {
									aggregateTotals[team] = 0;
								}
								aggregateTotals[team] += totals[team];
							}

							return {
								...session,
								totals,
								aggregateTotals
							};
						})
					)
			, {aggregateTotals: {}} as Session, 1),
		);
	}
}
