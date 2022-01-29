import { Spreadsheet } from "./google";
import { ChangeEventCR, ChangeEventUpdate, ObjectId } from 'mongodb';
import { Api as AdminApi } from "./majsoul/admin/Api";
import * as majsoul from "./majsoul";
import * as store from "./store";
import { Credentials } from 'google-auth-library';
import { getSecrets } from "./secrets";
import { combineLatest, concat, defer, from, fromEvent, merge, Observable, of } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, mergeAll, pairwise, share, shareReplay, takeUntil } from 'rxjs/operators';
import { Majsoul, Store } from ".";
import { google } from "googleapis";
import { ContestTracker } from "./ContestTracker";
import { parseGameRecordResponse } from "./majsoul/types/parseGameRecordResponse";
// import * as util from "util";

const nameofFactory = <T>() => (name: keyof T) => name;
export const nameofContest = nameofFactory<store.Contest<ObjectId>>();
const nameofConfig = nameofFactory<store.Config<ObjectId>>();

async function main() {
	const secrets = getSecrets();

	const apiResources = await majsoul.Api.retrieveApiResources();
	console.log(`Using api version ${apiResources.pbVersion}`);
	const adminApi = new AdminApi();
	const api = new majsoul.Api(apiResources);

	api.notifications.subscribe(n => console.log(n));
	await api.init();

	// console.log(api.majsoulCodec.decodeMessage(Buffer.from("", "hex")));

	await api.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);

	//spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));

	// api.getGame("").then(game => {
	// 	console.log(util.inspect(game.head, false, null));
		// console.log(util.inspect(parseGameRecordResponse(game), false, null));
	// });

	const mongoStore = new store.Store();
	await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");

	const googleAuth = new google.auth.OAuth2(
		secrets.google.clientId,
		secrets.google.clientSecret,
	);

	const googleTokenValid$ = process.env.NODE_ENV === "production"
		? concat(
			defer(() => googleAuth.getAccessToken()).pipe(
				map(response => response.token),
				catchError(() => of(null))
			),
			fromEvent<Credentials>(googleAuth, "tokens").pipe(
				map((tokens) => tokens?.access_token),
			)
		).pipe(
			distinctUntilChanged(),
			map(token => token != null),
			shareReplay(1),
		)
		: of(false);

	googleTokenValid$.subscribe(tokenIsValid => {
		console.log(`google token is ${tokenIsValid ? "" : "in"}valid`);
	})

	// oauth token
	merge(
		mongoStore.ConfigChanges.pipe(
			filter(change => change.operationType === "update"
				&& change.updateDescription.updatedFields.googleRefreshToken !== undefined
			),
			map((updateEvent: ChangeEventUpdate<store.Config<ObjectId>>) => updateEvent.updateDescription.updatedFields.googleRefreshToken)
		),
		defer(
			() => from(
				mongoStore.configCollection.find().toArray()
			).pipe(
				mergeAll(),
				map(config => config.googleRefreshToken)
			)
		)
	).subscribe(refresh_token => {
		if (googleAuth.credentials.refresh_token === refresh_token || refresh_token == null) {
			console.log(`refresh token not valid in database`);
			return;
		}

		googleAuth.setCredentials({
			refresh_token
		});
		googleAuth.getRequestHeaders();
	});

	// player search
	merge(
		mongoStore.PlayerChanges.pipe(
			filter(change => change.operationType === "insert"
				&& change.fullDocument.majsoulFriendlyId != null
			),
			map((insertEvent: ChangeEventCR<store.Player<ObjectId>>) => insertEvent.fullDocument)
		),
		defer(() => from(
			mongoStore.playersCollection.find({
				majsoulFriendlyId: {
					$exists: true
				}
			}).toArray()
		).pipe(mergeAll()))
	).subscribe(player => {
		api.findPlayerByFriendlyId(player.majsoulFriendlyId).then(async (apiPlayer) => {
			if (apiPlayer == null) {
				mongoStore.playersCollection.deleteOne({
					_id: player._id
				});
				return;
			}

			const update = await mongoStore.playersCollection.findOneAndUpdate(
				{
					majsoulId: apiPlayer.majsoulId
				},
				{
					$set: {
						...apiPlayer
					},
				}
			);

			if (update.value) {
				mongoStore.playersCollection.deleteOne({
					_id: player._id
				});
				return;
			}

			mongoStore.playersCollection.findOneAndUpdate(
				{
					_id: player._id
				},
				{
					$set: {
						...apiPlayer
					},
					$unset: {
						majsoulFriendlyId: true
					}
				}
			);
		})
	})

	// custom game id search
	merge(
		mongoStore.GameChanges.pipe(
			filter(change => change.operationType === "insert"
				&& change.fullDocument.contestMajsoulId == null
				&& change.fullDocument.majsoulId != null
			),
			map((insertEvent: ChangeEventCR<store.GameResult<ObjectId>>) => insertEvent.fullDocument)
		),
		defer(() => from(
			mongoStore.gamesCollection.find({
				notFoundOnMajsoul: {
					$exists: false
				},
				contestMajsoulId: {
					$exists: false
				}
			}).toArray()
		).pipe(mergeAll()))
	).subscribe(game => {
		console.log(`Custom game id added ${game.majsoulId}`);
		recordGame(
			game.contestId,
			game.majsoulId,
			mongoStore,
			api
		);
	});

	createContestIds$(mongoStore).subscribe((contestId) => {
		const tracker = new ContestTracker(contestId, mongoStore, api);

		concat(
			of(null),
			tracker.MajsoulId$.pipe(distinctUntilChanged())
		).pipe(pairwise())
			.subscribe(([previous, next]) => {
				if (next == null && previous != null) {
					mongoStore.gamesCollection.updateMany(
						{
							contestMajsoulId: previous
						},
						{
							$unset: {
								contestId: true,
							}
						}
					);
					return;
				}
				mongoStore.gamesCollection.updateMany(
					{
						contestMajsoulId: next
					},
					{
						$set: {
							contestId: contestId,
						}
					}
				);
			});

		tracker.AdminPlayerFetchRequested$
			.pipe(filter(fetchRequested => fetchRequested == true))
			.subscribe(async () => {
				const contest = await mongoStore.contestCollection.findOneAndUpdate(
					{ _id: contestId },
					{ $unset: { adminPlayerFetchRequested: true } },
					{ projection: {
						adminPlayerFetchRequested: true,
						majsoulId: true
					}}
				);
				console.log(`fetchRequested for contest #${contestId} #${contest.value.majsoulId}` );
				await adminApi.reconnect();
				try {
					await adminApi.logIn(secrets.majsoul.uid, secrets.majsoul.accessToken);
					await adminApi.manageContest(contest.value.majsoulId);
					const { players, error } = await adminApi.fetchContestPlayers();
					if (error) {
						console.log(error);
						return;
					}

					const existingPlayers = await mongoStore.playersCollection.find({
						majsoulId: {
							$in: players.map(player => player.account_id)
						}
					}).toArray();

					const newPlayers = players.filter(player => existingPlayers.find(existingPlayer => existingPlayer.majsoulId === player.account_id) == null);

					if (!newPlayers.length) {
						console.log("No new players to add found");
						return;
					}

					console.log(`Inserting ${newPlayers.length} players`);

					await mongoStore.playersCollection.insertMany(
							newPlayers.map(player => ({
								nickname: player.nickname,
								majsoulId: player.account_id,
							}))
					);

				} finally {
					adminApi.disconnect();
				}
			});

		tracker.UpdateRequest$.subscribe(async (majsoulFriendlyId) => {
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
			for (const gameId of await api.getContestGamesIds(majsoulContest.majsoulId)) {
				await recordGame(contestId, gameId.majsoulId, mongoStore, api);
			}
		});

		tracker.LiveGames$.subscribe(gameId => {
			recordGame(contestId, gameId, mongoStore, api);
		});

		const spreadsheet$ = combineLatest([
			tracker.SpreadsheetId$,
			googleTokenValid$,
		]).pipe(
			filter(([spreadsheetId, tokenIsValid]) => tokenIsValid && spreadsheetId != null),
			share(),
		);

		spreadsheet$.subscribe(async ([spreadsheetId]) => {
			const spreadsheet = new Spreadsheet(spreadsheetId, googleAuth);
			try {
				await spreadsheet.init();
			} catch (error) {
				console.log(`Spreadsheet #${spreadsheetId} failed to initialise.`, error);
				return;
			}

			console.log(`Tracking [${spreadsheetId}]`);
			tracker.RecordedGames$.pipe(
				takeUntil(spreadsheet$),
			).subscribe(game => {
				spreadsheet.addGame(game);
				spreadsheet.addGameDetails(game);
			})

			tracker.Teams$.pipe(
				takeUntil(spreadsheet$),
			).subscribe(async (teams) => {
				const players = await mongoStore.playersCollection.find({
					_id: {
						$in: teams.map(team => team.players).flat().map(team => team._id)
					}
				}).toArray();

				spreadsheet.updateTeams(
					teams,
					players.reduce((total, next) => (total[next._id.toHexString()] = next, total), {})
				);
			});
		})
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

	const gameRecord = await api.getGame(gameId);
	if (gameRecord == null) {
		console.log(`game #${gameId} not found!`)

		mongoStore.gamesCollection.updateOne(
			{ majsoulId: gameId },
			{ $set: { notFoundOnMajsoul: true } }
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
