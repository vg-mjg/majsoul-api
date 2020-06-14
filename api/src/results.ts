import { Spreadsheet } from "./google";
import { Credentials } from 'google-auth-library';
import * as fs from "fs";
import * as path from "path";
import * as util from "util";

import { ObjectId } from 'mongodb';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { RestApi } from "./rest/RestApi";

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

	const api = new majsoul.Api(await majsoul.Api.retrieveApiResources());
	await api.init();
	await api.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);

	//console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));

	const majsoulContest = await api.findContestByContestId(113331);
	// const contestId2 = await api.findContestUniqueId(917559);
	const sub = api.subscribeToContestChatSystemMessages(majsoulContest.majsoulId).subscribe(notification => {
		if (notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd") {
			setTimeout(() => addToSpreadSheet(notification.uuid), 5000);
		}
	});

	//spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

	const mongoStore = new store.Store();
	await mongoStore.init();

	let contest = (await mongoStore.contestCollection.findOneAndUpdate(
		{ majsoulId: majsoulContest.majsoulId },
		{ $setOnInsert: { ...majsoulContest } },
		{ upsert: true, returnOriginal: false }
	)).value;

	if (!contest.teams) {
		console.log(`Contest doesn't have teams, importing`);

		const teams = await spreadsheet.getTeamInformation();
		for (const team of teams) {
			team.players = (await Promise.all(team.players.map(player => mongoStore.playersCollection.findOneAndUpdate(
				{ nickname: player.nickname },
				{ $set: { displayName: player.displayName } },
				{
					upsert: true,
					returnOriginal: false,
					projection: { majsoulId: false }
				}
			)))).map(r => r.value);
			team._id = new ObjectId();
		}

		contest = (await mongoStore.contestCollection.findOneAndUpdate(
			{ _id: contest._id },
			{ $set: { teams } },
			{ returnOriginal: false }
		)).value;
	}

	if (!contest.sessions) {
		console.log(`Generating contest sessions`);
		const sessions = (await spreadsheet.getMatchInformation(contest.teams)).map(s => {s._id = new ObjectId(); return s}).reverse();
		contest = (await mongoStore.contestCollection.findOneAndUpdate(
			{ _id: contest._id },
			{ $set: { sessions } },
			{ returnOriginal: false }
		)).value;
	}

	const recordedGames = await mongoStore.gamesCollection.find({contestMajsoulId: contest.majsoulId}).toArray();

	const gameIds = await api.getContestGamesIds(contest.majsoulId);

	for (const game of gameIds) {
		if (!recordedGames.every(g => g.majsoulId !== game.majsoulId)) {
			console.log(`Game id ${game.majsoulId} already recorded`);
			continue;
		}

		const gameResult = await api.getGame(game.majsoulId);

		if (gameResult.players.length !== 4) {
			console.log(`Game id ${game.majsoulId} doesn't have enough players, skipping`);
			continue;
		}

		const session = (await mongoStore.contestCollection.findOne(
			{ _id: contest._id, 'sessions.scheduledTime': { $lte: gameResult.end_time } },
			{ projection: { "sessions.$.games": true, total: true } }
		));

		console.log(`Recording game id ${game.majsoulId}`);
		const gameRecord: store.GameResult<ObjectId> = {
			_id: undefined,
			sessionId: session.sessions[0]?._id,
			...gameResult,
			players: (await Promise.all(gameResult.players.map(player =>
				mongoStore.playersCollection.findOneAndUpdate(
					{ nickname: player.nickname },
					{ $set: { majsoulId: player.majsoulId } },
					{ upsert: true, returnOriginal: false, projection: { _id: true } }
				)
			))).map(p => p.value),
		};

		await mongoStore.gamesCollection.insertOne(gameRecord);
	}

	const restApi = new RestApi(mongoStore);
	restApi.init();
}

main();
