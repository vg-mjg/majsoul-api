import { Spreadsheet } from "./google";
import * as fs from "fs";
import * as util from "util";

import { ChangeEventCR, ChangeEventUpdate, ObjectId } from 'mongodb';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { getSecrets, getSecretsFilePath } from "./secrets";
import { concat, defer, EMPTY,  from,  merge,  Observable, Subject, Subscription, timer } from "rxjs";
import { filter, first, map, mapTo, mergeAll, share, switchAll, takeUntil } from 'rxjs/operators';
import { Majsoul, Store } from ".";

const nameofFactory = <T>() => (name: keyof T) => name;
const nameofContest = nameofFactory<store.Contest<ObjectId>>();

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

	const contestIds$ = await createContestIds$(mongoStore);
	contestIds$.subscribe((contestId) => {
		const {
			contestDeleted$,
			majsoulFriendlyId$,
			majsoulId$
		} = createContestObservables(contestId, mongoStore);

		const updateRequest$ = majsoulFriendlyId$.pipe(
			map(majsoulFriendlyId => {
				if (majsoulFriendlyId == null) {
					return EMPTY;
				}
				return timer(0, 86400000).pipe(
					mapTo(majsoulFriendlyId),
					takeUntil(contestDeleted$)
				)
			}),
			switchAll(),
		)

		updateRequest$.subscribe(async (majsoulFriendlyId) => {
			const majsoulContest = await api.findContestByContestId(majsoulFriendlyId);
			if (majsoulContest == null) {
				mongoStore.contestCollection.findOneAndUpdate(
					{ _id: contestId },
					{ $set: { notFoundOnMajsoul: true } },
				);

				console.log(`contest ${majsoulFriendlyId} not found on majsoul`);
				return;
			}

			console.log(`updating contest ${majsoulFriendlyId}`);

			mongoStore.contestCollection.findOneAndUpdate(
				{ _id: contestId },
				{ $set: { ...majsoulContest } },
			);

			console.log(`updating contest ${majsoulFriendlyId} games`);
			for (const gameId of await api.getContestGamesIds(majsoulContest.majsoulId)){
				await recordGame(contestId, gameId.majsoulId, mongoStore, api);
			}
		});

		const liveGames$ = majsoulId$.pipe(
			map(majsoulId =>
				api.subscribeToContestChatSystemMessages(majsoulId).pipe(
					filter(notification => notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd"),
					map(notification => notification.uuid as string),
					takeUntil(contestDeleted$)
				),
			),
			switchAll(),
		)

		liveGames$.subscribe(gameId => recordGame(contestId, gameId, mongoStore, api));
	});
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

	const gameResult = await api.getGame(gameId);
	if (gameResult == null) {
		console.log(`game #${gameId} not found!`)
		return;
	}

	mongoStore.recordGame(contestId, gameResult);
}


function createContestObservables(
	id: ObjectId,
	mongoStore: store.Store
): {
	contestDeleted$: Observable<any>;
	majsoulFriendlyId$: Observable<number>;
	majsoulId$: Observable<number>;
} {
	const contestDeleted$ = mongoStore.ContestChanges.pipe(
		filter(changeEvent => changeEvent.operationType === "delete"
			&& changeEvent.documentKey._id.equals(this.id)),
		share()
	);

	const contestUpdates$ = mongoStore.ContestChanges.pipe(
		filter(changeEvent =>
			changeEvent.operationType === "update"
			&& changeEvent.documentKey._id.equals(this.id)
		),
		share()
	) as Observable<ChangeEventUpdate<store.Contest<ObjectId>>>;

	const majsoulId$ = merge(
		defer(() => from(mongoStore.contestCollection.findOne({_id: this.id})))
			.pipe(map(contest => contest.notFoundOnMajsoul ? null as number : contest.majsoulId)),
		contestUpdates$.pipe(
			filter(event => event.updateDescription.removedFields.indexOf(nameofContest("majsoulId")) >= 0
				|| event.updateDescription.updatedFields?.notFoundOnMajsoul === true),
			mapTo(null as number),
		),
		contestUpdates$.pipe(
			filter(event => event.updateDescription.updatedFields?.majsoulId !== undefined),
			map(event => event.updateDescription.updatedFields.majsoulId)
		)
	).pipe(
		takeUntil(contestDeleted$)
	);

	const majsoulFriendlyId$ = merge(
		defer(() => from(mongoStore.contestCollection.findOne({_id: this.id})))
			.pipe(map(contest => contest.notFoundOnMajsoul ? null as number : contest.majsoulFriendlyId)),
		contestUpdates$.pipe(
			filter(event => event.updateDescription.removedFields.indexOf(nameofContest("majsoulFriendlyId")) >= 0
				|| event.updateDescription.updatedFields?.notFoundOnMajsoul === true),
			mapTo(null as number),
		),
		contestUpdates$.pipe(
			filter(event => event.updateDescription.updatedFields?.majsoulFriendlyId !== undefined),
			map(event => event.updateDescription.updatedFields.majsoulFriendlyId)
		)
	).pipe(
		takeUntil(contestDeleted$)
	);

	return {
		contestDeleted$,
		majsoulFriendlyId$,
		majsoulId$,
	}
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
