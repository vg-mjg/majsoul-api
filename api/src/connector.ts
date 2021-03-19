import { Spreadsheet } from "./google";
import * as fs from "fs";
import * as util from "util";

import { ChangeStream, ObjectId } from 'mongodb';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { getSecrets, getSecretsFilePath } from "./secrets";
import { Subscription } from "rxjs";

async function main() {
	async function addToSpreadSheet(gameId): Promise<void> {
		return;
		if (process.env.NODE_ENV !== "production" || process.env.MAJSOUL_ENV === "staging") {
			console.log("skipping spreadsheet write");
			return;
		}

		if(spreadsheet.isGameRecorded(gameId) && spreadsheet.isGameDetailRecorded(gameId)) {
			console.log(`Already written game ${gameId} to spreadsheet`);
			return;
		}

		const gameResult = await api.getGame(gameId);

		if (gameResult == null){
			console.log(`Unable to retrieve game ${gameId}, skipping spreadsheet add`);
			return;
		}

		if (gameResult.players.length < 4 || !gameResult.players.every(p => p.nickname)) {
			return;
		}

		spreadsheet.addGame(gameResult);
		spreadsheet.addGameDetails(gameResult);
	};

	async function trackContest(contest: store.Contest<ObjectId>): Promise<Subscription> {
		const majsoulContest = await api.findContestByContestId(contest.majsoulFriendlyId);
		if (majsoulContest == null) {
			console.log(`contest ${contest.majsoulFriendlyId} not found on majsoul`);
			return null;
		}
		console.log(`tracking contest ${contest.majsoulFriendlyId}`);

		contest = (await mongoStore.contestCollection.findOneAndUpdate(
			{ majsoulId: majsoulContest.majsoulId },
			{ $set: { ...majsoulContest } },
			{ upsert: true, returnOriginal: false }
		)).value;

		const gameIds = await api.getContestGamesIds(contest.majsoulId);

		for (const game of gameIds) {
			await addToSpreadSheet(game.majsoulId);
		}

		for (const game of gameIds) {
			if (await mongoStore.isGameRecorded(game)){
				console.log(`Game id ${game.majsoulId} already recorded`);
				continue;
			}

			const gameResult = await api.getGame(game.majsoulId);

			await mongoStore.recordGame(contest, gameResult);
		}

		const mongoSub = api.subscribeToContestChatSystemMessages(majsoulContest.majsoulId).subscribe(notification => {
			if (notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd") {
				setTimeout(() => {
					api.getGame(notification.uuid)
						.then(gameResult => mongoStore.recordGame(contest, gameResult)
						.catch(e => console.log(e)));
				}, 5000);
			}
		});

		return mongoSub;
	}

	const secrets = getSecrets();

	const googleAppInfo = {
		clientId: secrets.googleCreds.installed.client_id,
		clientSecret: secrets.googleCreds.installed.client_secret,
		redirectUri: secrets.googleCreds.installed.redirect_uris[0],
		authToken: secrets.googleAuthToken
	}

	if (!googleAppInfo.authToken && process.env.NODE_ENV !== "production") {
		googleAppInfo.authToken = secrets.googleAuthToken = await Spreadsheet.getAuthTokenInteractive(googleAppInfo);
		fs.writeFileSync(getSecretsFilePath(), JSON.stringify(secrets));
	}

	const spreadsheet = new Spreadsheet(googleAppInfo);
	await spreadsheet.init();

	const api = new majsoul.Api(await majsoul.Api.retrieveApiResources());
	await api.init();
	await api.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);

	// const sub = api.subscribeToContestChatSystemMessages(majsoulContest.majsoulId).subscribe(notification => {
	// 	if (notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd") {
	// 		setTimeout(() => addToSpreadSheet(notification.uuid), 5000);
	// 	}
	// });

	//console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));
	//spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

	const mongoStore = new store.Store();
	await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");
	mongoStore.contestCollection.watch().on("change", (next => {
		console.log(next);
	}))

	const contests = await mongoStore.contestCollection.find().toArray();

	const subscriptions = await Promise.all(
		contests
			.filter(contest => contest.majsoulFriendlyId != null)
			.map(contest => trackContest(contest))
	);
}

main().catch(e => console.log(e));
