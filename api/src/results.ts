import { Spreadsheet } from "./google";
import { Api } from "./majsoul/Api";
import { Credentials } from 'google-auth-library';
import * as cors from "cors";
import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { MongoClient, Collection, ObjectId } from 'mongodb';
import { IGameResult, IContest, IPlayer, ISession } from "./majsoul/types/types";
import * as express from 'express';

interface ISecrets {
	majsoul: {
		uid: string;
		accessToken: string;
	};
	googleCreds: {
		installed: {
			client_id: string;
			client_secret: string;
			redirect_uris: string[];
		}
	}
	googleAuthToken: Credentials;
}

async function main() {
	async function addToSpreadSheet(gameId): Promise<void> {
		if(spreadsheet.isGameRecorded(gameId) && spreadsheet.isGameDetailRecorded(gameId)) {
			return;
		}

		let gameResult;
		for(let retries = 0; retries < 3; retries++) {
			gameResult = await api.getGame(gameId);
			if (gameResult != null) {
				break;
			}
			await new Promise(resolve => setTimeout(resolve, 1000));
		}

		if (gameResult == null){
			console.log(`Unable to retrieve game ${gameId}, skipping spreadsheet add`);
			return;
		}

		if (gameResult.players.length < 4 || !gameResult.players.every(p => p.name)) {
			return;
		}

		spreadsheet.addGame(gameResult);
		spreadsheet.addGameDetails(gameResult);
	};

	const secretsPath = process.env.MAJSOUL_ENV === "prod"
	? "/run/secrets/majsoul.json"
	: path.join(path.dirname(__filename), 'secrets.json');

	const secrets: ISecrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
	const googleAppInfo = {
		clientId: secrets.googleCreds.installed.client_id,
		clientSecret: secrets.googleCreds.installed.client_secret,
		redirectUri: secrets.googleCreds.installed.redirect_uris[0],
		authToken: secrets.googleAuthToken
	}

	if (!googleAppInfo.authToken && process.env.MAJSOUL_ENV !== "prod") {
		googleAppInfo.authToken = secrets.googleAuthToken = await Spreadsheet.getAuthTokenInteractive(googleAppInfo);
		fs.writeFileSync(secretsPath, JSON.stringify(secrets));
	}

	const spreadsheet = new Spreadsheet(googleAppInfo);
	await spreadsheet.init();

	const api = new Api(await Api.retrieveMahjsoulApiResources());
	await api.init();
	await api.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);

	//console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));

	let contest = await api.findContestByContestId(113331);
	// const contestId2 = await api.findContestUniqueId(917559);
	const sub = api.subscribeToContestChatSystemMessages(contest.majsoulId).subscribe(notification => {
		if (notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd") {
			setTimeout(() => addToSpreadSheet(notification.uuid), 5000);
		}
	});

	//spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

	const url = 'mongodb://root:example@localhost:27017/?authMechanism=SCRAM-SHA-256&authSource=admin';
	const dbName = 'majsoul';
	const client = new MongoClient(url);
	let contestCollection: Collection<IContest>;
	let gamesCollection: Collection<IGameResult>;
	let playersCollection: Collection<IPlayer>;
	try {
		await client.connect();

		console.log("Connected successfully to server");
		const db = client.db(dbName);

		contestCollection = await db.createCollection("contests", {});
		contestCollection.createIndex({majsoulId: 1});
		gamesCollection = await db.createCollection("games", {});
		gamesCollection.createIndex({majsoulId: 1});
		playersCollection = await db.createCollection("players", {});
		playersCollection.createIndex({majsoulId: 1});
	} catch (e) {
		console.log(e);
	}

	console.log(contest);

	const teams = await spreadsheet.getTeamInformation();
	for (const team of teams) {
		team.players = (await Promise.all(team.players.map(player => playersCollection.findOneAndUpdate(
			{ nickname: player.nickname },
			{ $set: { displayName: player.displayName } },
			{
				upsert: true,
				returnOriginal: false,
				projection: { majsoulId: false }
			}
		)))).map(r => r.value);
		team.id = new ObjectId();
	}

	contest.teams = teams;

	const recordedGames = (await
		contestCollection.findOne({contestId: contest.contestId}, { projection: { sessions: true } })
	)?.sessions.map(s => s.games)
		.flat()
		.map(g => g.majsoulId) ?? [];

	console.log(recordedGames);

	const gameIds = await api.getContestGamesIds(contest.majsoulId);

	const games = (await Promise.all(gameIds.map(async (game) => {
		if (recordedGames.indexOf(game.id) !== -1) {
			console.log(`Game id ${game.id} already recorded`);
			return;
		}

		const gameResult = await api.getGame(game.id);
		gameResult.players = (await Promise.all(gameResult.players.map(player =>
			playersCollection.findOneAndUpdate(
				{ nickname: player.nickname },
				{ $set: { majsoulId: player.majsoulId } },
				{ upsert: true, returnOriginal: false, projection: { majsoulId: false } }
			)
		))).map(p => p.value);

		if (gameResult.players.length !== 4) {
			console.log(`Game id ${game.id} doesn't have enough players, skipping`);
			return;
		}

		gameResult.contestId = contest.majsoulId;
		gameResult.id = new ObjectId();

		console.log(`Recording game id ${game.id}`);
		return gameResult;
	}))).filter(g => g != null);

	const sessions = await spreadsheet.getMatchInformation(teams);

	for(let i = 1; games.length > 0;) {
		const game = games.shift();
		if (game.end_time * 1000 >= sessions[i].scheduledTime) {
			i++;
		}
		sessions[i-1].games.push(game);
	}

	contest.sessions = sessions;

	contest = (await contestCollection.findOneAndUpdate(
		{ majsoulId: contest.majsoulId },
		{ $setOnInsert: {
			...contest
		}},
		{
			upsert: true,
			returnOriginal: false
		},
	)).value;

	//TODO: add games after initial import

	const app = express();
	app.use(cors());
	app.listen(3000, () => console.log(`Express started`));
	app.put('/players/:nickname', (req, res) => {
		playersCollection.findOneAndReplace(
			{ nickname: req.params.nickname },
			req.body,
			{ }
		).then(result => result.value ? (result.ok ? res.sendStatus(200) : res.status(500).send(result.lastErrorObject)) : res.sendStatus(404))
		.catch(error => res.status(500).send(error));
	});

	app.get('/players', (req, res) => {
		playersCollection.find({}, { projection: { _id: false } }).toArray()
		.then(players => res.send(players))
		.catch(error => res.status(500).send(error));
	});

	app.get('/players/:id', (req, res) => {
		playersCollection.findOne(
			{ nickname: req.params.nickname },
			{ projection: { _id: false } }
		).then(player => player ? res.send(player) : res.sendStatus(404))
		.catch(error => res.status(500).send(error));
	});

	app.get('/contests/:id/sessions', (req, res) => {
		contestCollection.findOne(
			{ contestId: parseInt(req.params.id) },
			{ projection: { sessions: true } }
		).then(contest => res.send(contest.sessions))
		.catch(error => res.status(500).send(error));
	});

	app.get('/contests/:id/teams', (req, res) => {
		contestCollection.findOne(
			{ contestId: parseInt(req.params.id) },
			{ projection: { teams: true } }
		).then(contest => res.send(contest.teams))
		.catch(error => res.status(500).send(error));
	});

	app.get('/contests/:id', (req, res) => {
		contestCollection.findOne(
			{ contestId: parseInt(req.params.id) }
		).then(contest => res.send(contest))
		.catch(error => res.status(500).send(error));
	});

	app.get('/contests/:id/summary', (req, res) => {
		contestCollection.findOne(
			{ contestId: parseInt(req.params.id) }
		).then(contest => {
			try {
				function* sessionSummary(contest: IContest) {
					const total = contest.teams.reduce((total, next) => { total[next.id.toHexString()] = 0; return total }, {});
					for(const session of contest.sessions.filter(s => s.games.length)) {
						for(const game of session.games) {
							game.players.forEach((player, index) => {
								const team = contest.teams.find(t => t.players.find(p => p._id.equals(player._id)));
								total[team.id.toHexString()] += game.finalScore[index].uma
							});
						}
						for (const id in total) {
							total[id] = Math.round(10 * total[id]) / 10;
						}
						yield {
							startTime: session.scheduledTime,
							standings: { ...total }
						};
					}
				}

				res.send({
					name: contest.name,
					contestId: contest.contestId,
					teams: contest.teams.reduce((total, next) => { total[next.id.toHexString()] = {name: next.name}; return total }, {}),
					results: [...sessionSummary(contest)],
					nextSession: contest.sessions.find(s => s.games.length <= 0),
					recentSession: contest.sessions.filter(s => s.games.length > 0).slice(-1)[0]
				});
			} catch (e) {
				console.log(e);
			}
		})
		.catch(error => res.status(500).send(error));
	});

	app.get('/games', (req, res) => {
		// gamesCollection.find(
		// 	{game}
		// )
		playersCollection.find({}, { projection: { _id: false } }).toArray()
		.then(players => res.send(players))
		.catch(error => res.status(500).send(error));
	});
}

main();
