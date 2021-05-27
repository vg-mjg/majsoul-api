import { Spreadsheet } from "./google";
import { ChangeEventCR, ChangeEventUpdate, ObjectId } from 'mongodb';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { Credentials } from 'google-auth-library';
import { getSecrets } from "./secrets";
import { combineLatest, concat, defer, from,  fromEvent,  merge,  Observable, of } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, mergeAll, pairwise, share, shareReplay, takeUntil } from 'rxjs/operators';
import { Majsoul, Store } from ".";
import { google } from "googleapis";
import { ContestTracker } from "./ContestTracker";
import { parseGameRecordResponse } from "./majsoul/types/parseGameRecordResponse";

const nameofFactory = <T>() => (name: keyof T) => name;
export const nameofContest = nameofFactory<store.Contest<ObjectId>>();
const nameofConfig = nameofFactory<store.Config<ObjectId>>();

async function main() {
	const secrets = getSecrets();
	const apiResources = await majsoul.Api.retrieveApiResources();
	console.log(`Using api version ${apiResources.pbVersion}`);
	const api = new majsoul.Api(apiResources);

	api.notifications.subscribe(n => console.log(n));
	await api.init();
	await api.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);

	// const sub = api.subscribeToContestChatSystemMessages(majsoulContest.majsoulId).subscribe(notification => {
	// 	if (notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd") {
	// 		setTimeout(() => addToSpreadSheet(notification.uuid), 5000);
	// 	}
	// });

	//console.log(api.majsoulCodec.decodeMessage(Buffer.from("0227000a282e6c712e4c6f6262792e6c65617665437573746f6d697a6564436f6e7465737443686174526f6f6d1200", "hex")));
	//spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

	api.getGame("210527-bca2215d-2d17-47b4-a419-f1c43f6b50c5").then(game => console.log(parseGameRecordResponse(game)));
	return;

}

async function recordGame(
	contestId: ObjectId,
	gameId: string,
	mongoStore: Store.Store,
	api: Majsoul.Api
): Promise<void> {
	const isRecorded = await mongoStore.isGameRecorded(gameId);
	if (isRecorded) {
		console.log(`Game id ${gameId} already recorded`);
		return;
	}

	const gameRecord = await api.getGame(gameId);
	if (gameRecord == null) {
		console.log(`game #${gameId} not found!`)

		mongoStore.gamesCollection.updateOne(
			{ majsoulId: gameId },
			{ $set: { notFoundOnMajsoul: true }}
		);
		return;
	}

	const gameResult = parseGameRecordResponse(gameRecord);
	if (gameResult == null) {
		console.log(`game #${gameId} couldn't be parsed!`)
	}

	mongoStore.recordGame(contestId, gameResult);
}

function createContestIds$(mongoStore: store.Store): Observable<ObjectId> {
	return merge(
		mongoStore.ContestChanges.pipe(
			filter(changeEvent => changeEvent.operationType === "insert"),
			map((changeEvent: ChangeEventCR<store.Contest<ObjectId>>) => changeEvent.documentKey._id)
		),
		defer(() => from(mongoStore.contestCollection.find().toArray()))
			.pipe(
				mergeAll(),
				map(contest => contest._id)
			)
	);
}

main().catch(e => console.log(e));
