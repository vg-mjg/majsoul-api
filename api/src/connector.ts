import { Spreadsheet } from "./google";
import * as fs from "fs";
import * as util from "util";

import { ObjectId } from 'mongodb';
import * as majsoul from "./majsoul";
import * as store from "./store";
import { getSecrets, getSecretsFilePath } from "./secrets";
import { defer, EMPTY,  from,  merge,  Observable, Subject } from "rxjs";
import { filter, first, map, mergeAll, takeUntil } from 'rxjs/operators';

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

	const trackables = await createTrackableContestObservable(mongoStore);

	const trackablesSub = trackables.subscribe((trackable) => {
		trackContest(api, trackable).then(tracking => {
			if (tracking.contest == null) {
				mongoStore.contestCollection.findOneAndUpdate(
					{ _id: trackable.contestId },
					{ $set: { majsoulId: null } },
				);

				console.log(`contest ${trackable.majsoulFriendlyId} not found on majsoul`);
				return;
			}

			console.log(`tracking contest ${trackable.majsoulFriendlyId}`);

			mongoStore.contestCollection.findOneAndUpdate(
				{ _id: trackable.contestId },
				{ $set: { ...tracking.contest } },
			);

			const sub = tracking.games$.subscribe((gameId) => {
				mongoStore.isGameRecorded(gameId).then(isRecorded => {
					if (isRecorded) {
						console.log(`Game id ${gameId} already recorded`);
						return;
					}

					api.getGame(gameId).then(gameResult => {
						mongoStore.recordGame(trackable.contestId, gameResult);
					});
				})
			})
		})
	});
}

interface TrackableContest {
	contestId: ObjectId;
	majsoulFriendlyId: number;
	trackingEnd$: Observable<void | ObjectId>;
}

function createTrackableContestObservable(mongoStore: store.Store): Observable<TrackableContest> {
	const trackingEnded = new Subject<ObjectId>();
	const createTrackable = (contestId: ObjectId, majsoulFriendlyId: number): TrackableContest => {
		return {
			contestId: contestId,
			majsoulFriendlyId: majsoulFriendlyId,
			trackingEnd$: trackingEnded.pipe(first((id: ObjectId) => contestId.equals(id))),
		}
	}

	return merge(
		new Observable<TrackableContest>((subscriber) => {
			const stream = mongoStore.contestCollection.watch().on("change", (change => {
				switch (change.operationType) {
					case "update": {
						if (change.updateDescription.removedFields.indexOf(nameofContest("majsoulFriendlyId")) >= 0) {
							trackingEnded.next(change.documentKey._id);
							return;
						}

						const updatedValue = change.updateDescription.updatedFields.majsoulFriendlyId;
						if (updatedValue == null) {
							return;
						}

						subscriber.next(createTrackable(change.documentKey._id, updatedValue))
						return;
					} case "delete": {
						trackingEnded.next(change.documentKey._id);
						return;
					}
				}
			}));

			return () =>{
				stream.close();
			};
		}),
		defer(() => from(mongoStore.contestCollection.find().toArray()))
			.pipe(
				mergeAll(),
				filter(contest => contest.majsoulFriendlyId != null && contest.majsoulId !== null),
				map(contest => createTrackable(contest._id, contest.majsoulFriendlyId))
			),
	);
}

async function trackContest(
	majsoulApi: majsoul.Api,
	trackable: TrackableContest
): Promise<{
	contest: majsoul.Contest,
	games$: Observable<string>
}> {
	const majsoulContest = await majsoulApi.findContestByContestId(trackable.majsoulFriendlyId);
	if (majsoulContest == null) {
		return {
			contest: null,
			games$: EMPTY
		};
	}

	return {
		contest: majsoulContest,
		games$: merge(
			majsoulApi.subscribeToContestChatSystemMessages(majsoulContest.majsoulId).pipe(
				filter(notification => notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd"),
				map(notification => notification.uuid),
				takeUntil(trackable.trackingEnd$)
			),
			defer(() => from(majsoulApi.getContestGamesIds(majsoulContest.majsoulId)))
				.pipe(
					mergeAll(),
					map(contest => contest.majsoulId)
				),
		)
	}
}

main().catch(e => console.log(e));
