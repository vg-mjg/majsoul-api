import { Spreadsheet } from "./google";
import { MajsoulApi } from "./MajsoulApi";
import { Credentials } from 'google-auth-library';
import * as cors from "cors";
import * as fs from "fs";
import * as path from "path";

import { MongoClient, Collection } from 'mongodb';
import { IGameResult, IContest, IPlayer, ISession } from "../../majsoul-types";
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

	const api = new MajsoulApi(await MajsoulApi.retrieveMahjsoulApiResources());
	await api.init();
	await api.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);

	//console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));

	const contest = await api.findContestByContestId(113331);
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

	await contestCollection.findOneAndReplace(
		{ majsoulId: contest.majsoulId },
		contest,
		{ upsert: true }
	);

	const teams = await spreadsheet.getTeamInformation();
	for (const team of teams) {
		for (const player of team.players) {
			await playersCollection.findOneAndUpdate(
				{ nickname: player.nickname },
				{ $set: { displayName: player.displayName } },
				{ upsert: true }
			);
		}
		await contestCollection.findOneAndUpdate(
			{ majsoulId: contest.majsoulId },
			{ $set: { teams: teams } }
		);
	}

	const recordedGames = (await gamesCollection.find({}, { projection: { majsoulId: true } }).toArray()).map(g => g.majsoulId);
	console.log(recordedGames);

	try {
		const gameIds = await api.getContestGamesIds(contest.majsoulId);

		for (const game of gameIds) {
			if (recordedGames.indexOf(game.id) !== -1) {
				console.log(`Game id ${game.id} already recorded`);
				continue;
			}

			const gameResult = await api.getGame(game.id);
			for (const player of gameResult.players) {
				await playersCollection.findOneAndUpdate(
					{ nickname: player.name },
					{ $set: { majsoulId: player.majsoulId } },
					{ upsert: true }
				)
			}

			if (gameResult.players.length !== 4) {
				console.log(`Game id ${game.id} doesn't have enough players, skipping`);
				continue;
			}

			gameResult.contestId = contest.majsoulId.toString();

			console.log(`Recording game id ${game.id}`);
			await gamesCollection.insertOne(
				gameResult
			);
		}
	} catch (e){
		console.log(e);
	}

	const sessions: ISession[] = [];
	let date = new Date(2020, 5, 26, 18).getTime();
	for (let weeks = 0; weeks < 5; weeks++) {
		sessions.push({})
	}

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
	})
}

main();
