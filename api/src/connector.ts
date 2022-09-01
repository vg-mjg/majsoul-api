import { Spreadsheet } from "./google.js";
import { ChangeStreamInsertDocument, ObjectId, ChangeStreamUpdateDocument } from 'mongodb';
import { MajsoulAdminApi, Passport, MajsoulApi } from "majsoul";
import { Credentials } from 'google-auth-library';
import { getSecrets } from "./secrets.js";
import { combineLatest, concat, defer, from, fromEvent, merge, Observable, of } from "rxjs";
import { catchError, distinctUntilChanged, filter, map, mergeAll, pairwise, share, shareReplay, takeUntil, zipWith, withLatestFrom, combineLatestWith, scan, switchAll } from 'rxjs/operators';
import { Store } from "./index.js";
import { google } from "googleapis";
import { ContestTracker } from "./ContestTracker.js";
import { parseGameRecordResponse } from "./connector/parseGameRecordResponse.js";
import fetch, { HeadersInit } from "node-fetch";
import * as UserAgent from "user-agents";
import { GachaPull, GameResult, TourneyContestScoringType } from "./store/index.js";
import seedrandom from "seedrandom";

const nameofFactory = <T>() => (name: keyof T) => name;
export const nameofContest = nameofFactory<Store.Contest<ObjectId>>();

async function getOrGenerateUserAgent(mongoStore: Store.Store): Promise<string> {
	const [config] = await mongoStore.configCollection.find().toArray();
	if (!config.userAgent) {
		config.userAgent = new UserAgent({
			platform: process.platform === "win32" ? "Win32" : "Linux x86_64"
		}).toString();

		await mongoStore.configCollection.updateOne(
			{
				_id: config._id,
			},
			{
				$set: {
					userAgent: config.userAgent
				}
			}
		);
	}
	return config.userAgent;
}

async function getPassport(
	{userId, accessToken, userAgent, existingCookies }: {
		userId: string;
		accessToken: string;
		userAgent: string;
		existingCookies: Store.Cookie[];
	}
): Promise<{
	passport: Passport,
	loginCookies: Store.Cookie[]
}> {
	const sharedSpoofHeaders = {
		"User-Agent": userAgent
	};

	console.log(sharedSpoofHeaders);

	const cookie = (existingCookies)
		.map(cookie => `${cookie.key}=${cookie.value}`).join(";");

	console.log(cookie, cookie.length);

	const optionsHeaders: HeadersInit = {
		...sharedSpoofHeaders,
	}

	if (cookie.length) {
		(optionsHeaders as any).cookie = cookie;
	}

	const loginCookies = [...existingCookies];

	try {
		const headers = (await fetch("https://passport.mahjongsoul.com/user/login", {
			method: "OPTIONS",
			headers: optionsHeaders,
		})).headers.raw();
		console.log(headers);


		const cookieTime = Date.now();

		const newCookies = headers["set-cookie"]
			?.map(cookie => {
				const parts = cookie.split(';').map(part => part.trim().split(/=(.*)/s));
				const [key, value] = parts[0];

				const maxAgePart = parts.find(([key]) => key.startsWith("Max-Age"));

				if (maxAgePart) {
					const maxAge = parseInt(maxAgePart[1]);
					if (!isNaN(maxAge)) {
						return {
							key,
							value,
							expires: cookieTime + maxAge * 1000
						}
					}
				}

				const expires = parts.find(([key]) => key.startsWith("expires"));
				if (!expires) {
					return {
						key,
						value,
						expires: cookieTime + 24 * 60 * 60 * 1000
					}
				}

				return {
					key,
					value,
					expires: Date.parse(expires[1])
				}
			}) ?? [];

		console.log(newCookies);

		loginCookies.push(...newCookies);
	} catch (e) {
		console.log(e)
		return {
			passport: null,
			loginCookies
		}
	}

	const joinedCookies = loginCookies
		.map(cookie => `${cookie.key}=${cookie.value}`).join(";");

	console.log(joinedCookies);

	try {
		const passport = await (await fetch("https://passport.mahjongsoul.com/user/login", {
			method: "POST",
			headers: {
				...sharedSpoofHeaders,
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				cookies: joinedCookies
			},
			body: JSON.stringify({
				"uid": userId,
				"token": accessToken,
				"deviceId": `web|${userId}`
			})
		})).json() as Passport;

		return {
			passport,
			loginCookies,
		}
	} catch {
		return {
			loginCookies,
			passport: null,
		}
	}
}

async function main() {
	const secrets = getSecrets();

	const mongoStore = new Store.Store();
	try {
		await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");
	} catch (error) {
		console.log("failed to connect to mongo db: ", error);
		process.exit(1);
	}

	const userAgent = await getOrGenerateUserAgent(mongoStore);
	const [config] = await mongoStore.configCollection.find().toArray();

	const expireDeadline = Date.now() + 60 * 1000;
	const existingCookies = (config.loginCookies ?? []).filter(cookie => !cookie.expires || cookie.expires > expireDeadline);
	const {passport: dynamicPassport, loginCookies} = (await getPassport(
		{
			userId: secrets.majsoul.uid,
			accessToken: secrets.majsoul.accessToken,
			userAgent,
			existingCookies,
		}
	)) ?? {};

	await mongoStore.configCollection.updateOne(
		{
			_id: config._id,
		},
		{
			$set: {
				loginCookies
			},
		}
	);

	if (dynamicPassport) {
		await mongoStore.configCollection.updateOne(
			{
				_id: config._id,
			},
			{
				$set: {
					passportToken: dynamicPassport.accessToken
				},
			}
		);
	}

	const passportToken = dynamicPassport?.accessToken ?? config.passportToken ?? secrets.majsoul.passportToken;
	console.log(dynamicPassport?.accessToken, config.passportToken, secrets.majsoul.passportToken);

	if (!passportToken) {
		console.log("failed to aquire passport");
		process.exit(1);
	}

	const passport: Passport  = {
		accessToken: passportToken,
		uid: secrets.majsoul.uid,
	};

	const apiResources = await MajsoulApi.retrieveApiResources();
	console.log(`Using api version ${apiResources.pbVersion}`);
	const adminApi = new MajsoulAdminApi();
	const api = new MajsoulApi(apiResources);

	api.notifications.subscribe(n => console.log(n));
	await api.init();

	// console.log(api.majsoulCodec.decodeMessage(Buffer.from("", "hex")));

	await api.logIn(passport);

	api.errors$.subscribe((error => {
		console.log("error detected with api connection: ", error);
		process.exit(1);
	}));

	//spreadsheet.addGameDetails(await api.getGame(decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split('_')[0]));


	// api.getGame(
	// 	// Codec.decodePaipuId("")
	// 	// ""
	// ).then(game => {
	// 	parseGameRecordResponse(game);
	// 	// console.log(util.inspect(game.head, false, null));
	// 	// console.log(util.inspect(parseGameRecordResponse(game), false, null));
	// });

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
			map((updateEvent: ChangeStreamUpdateDocument<Store.Config<ObjectId>>) => updateEvent.updateDescription.updatedFields.googleRefreshToken)
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
			map((insertEvent: ChangeStreamInsertDocument<Store.Player<ObjectId>>) => insertEvent.fullDocument)
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
			map((insertEvent: ChangeStreamInsertDocument<Store.GameResult<ObjectId>>) => insertEvent.fullDocument)
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

				if (next == null) {
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
					await adminApi.logIn(passport);
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

		tracker.PhaseInfo$.pipe(
			filter(({contest}) => (console.log(contest), contest.gacha?.groups?.length > 0 && contest.gacha.groups[0].cards?.length > 0)),
			combineLatestWith(
				merge (
					from([null as never]),
					tracker.GachaDeleted$
				)
			),
			map(([{phases, contest}]) => {
				phases.sort((a, b) => b.startTime - a.startTime);
				return tracker.RecordedGames$.pipe(
					map(game => {
						const phaseIndex = phases.findIndex(phase => phase.startTime > game.start_time);
						const phase = phases[(phaseIndex < 1 ? phases.length - 1 : phaseIndex - 1)];
						return {
							game,
							phase,
						}
					}),
					filter(({phase}) => (phase.tourneyType === TourneyContestScoringType.Gacha)),
					map((data) =>
						defer(() => from(mongoStore.gachaCollection.find({gameId: data.game._id}).toArray()).pipe(
							zipWith(from([data]))
						))
					),
					mergeAll(),
					filter(([gachas]) => gachas.length <= 0),
					map(([_, data]) => data),
					withLatestFrom(from([contest])),
				)
			 }),
			switchAll()
		).pipe(
			map(([{game, phase}, contest]) => {
				const seed = [game._id.toHexString(), game.end_time, game.finalScore.map(score => score.score).join("")].join(":");
				console.log(`Rolling gacha for game id ${game.majsoulId} seed ${seed}`);
				const rand = seedrandom(seed);

				if (contest.normaliseScores) {
					const lowestScore = game.finalScore.reduce((lowest, next) => (lowest < next.uma ? lowest : next.uma), Number.POSITIVE_INFINITY);
					for (const score of game.finalScore) {
						score.uma -= lowestScore;
					}
				}

				contest.gacha.groups.sort((a, b) => a.priority - b.priority);

				const possibleRollsPerPlayer = game.finalScore.map((score, index) => [
					...rollGachaForScore(rand, contest, game, index, score.uma)
				].filter(roll => roll.length));

				return () => validatePossibleRolls(mongoStore, game, contest, possibleRollsPerPlayer, rand);
			}),
			scan((total, next) => total.then(next),  Promise.resolve())
		).subscribe(() => {});

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
	api: MajsoulApi
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

function createContestIds$(mongoStore: Store.Store): Observable<ObjectId> {
	return merge(
		mongoStore.ContestChanges.pipe(
			filter(changeEvent => changeEvent.operationType === "insert"),
			map((changeEvent: ChangeStreamInsertDocument<Store.Contest<ObjectId>>) => changeEvent.documentKey._id)
		),
		defer(() => from(mongoStore.contestCollection.find().toArray()))
			.pipe(
				mergeAll(),
				map(contest => contest._id)
			)
	);
}

main().catch(e => console.log(e));

function * rollGachaForScore(rand: seedrandom.PRNG, contest: Store.Contest<ObjectId>, game: GameResult<ObjectId>, index: number, uma: number){
	while (uma >= 1000) {
		const roll = rand();
		yield contest.gacha.groups.filter(group => group.onePer * roll < 1).map(group => (
			{
				group,
				pull: {
					gameId: game._id,
					playerId: game.players[index]._id,
					gachaGroupId: group._id,
					gachaCardId: group.cards[(rand() * group.cards.length) | 0]._id
				} as GachaPull<ObjectId>
			}));
		uma -= 1000;
	}
}

type RollMap = Record<string, {total: number, players: Record<string, GachaPull<ObjectId>[]>}>;

function addRollToMap(total: RollMap, next: GachaPull<ObjectId>): RollMap {
	const groupId = next.gachaGroupId?.toHexString();
	if (groupId == null) {
		return total;
	}

	const playerId = next.playerId?.toHexString();
	if (playerId == null) {
		return total;
	}

	total[groupId] ??= {
		total: 0,
		players: {}
	};
	total[groupId].total++;
	total[groupId].players[playerId] ??= [];
	total[groupId].players[playerId].push(next);
	return total;
}

async function validatePossibleRolls(
	mongoStore: Store.Store,
	game: Store.GameResult<ObjectId>,
	contest: Store.Contest<ObjectId>,
	possibleRollsPerPlayer: { group: Store.GachaGroup<ObjectId>; pull: Store.GachaPull<ObjectId>; }[][][],
	rand: seedrandom.PRNG,
): Promise<any> {
	const uniqueGroups = new Set(possibleRollsPerPlayer.flat().flat().filter(roll => roll.group.unique).map(roll => roll.group._id));

	const matchingGacha = uniqueGroups.size
		? await mongoStore.gachaCollection.find({gachaGroupId: {$in: [...uniqueGroups]}}).toArray()
		: [];

	const gamesInContest = matchingGacha.length
		? await mongoStore.gamesCollection.find(
			{
				_id: { $in: [...new Set(matchingGacha.map(pull => pull.gameId))] },
				contestId: contest._id,
			},
			{
				projection: {
					_id: true,
					contestId: true,
				}
			}
		).toArray()
		: [];

	const existingGacha = matchingGacha.filter(pull => gamesInContest.find(game => game._id.equals(pull.gameId)))

	const gachaGroupMap = existingGacha.reduce(addRollToMap, {} as RollMap);

	const pulls = [
		{
			gameId: game._id
		}
	] as GachaPull[];

	for (const player of possibleRollsPerPlayer) {
		for (const rollOption of player) {
			const correctRoll = rollOption.find(roll =>
				!roll.group.unique
					|| (
						(gachaGroupMap[roll.group._id.toHexString()]?.total ?? 0) < roll.group.cards.length
							&& (gachaGroupMap[roll.group._id.toHexString()]?.players[roll.pull.playerId.toHexString()]?.length ?? 0) === 0
					)

			);

			if (!correctRoll) {
				continue;
			}

			if (correctRoll.group.unique) {
				const selectedGroupMembers = existingGacha.filter(gacha => gacha.gachaGroupId.equals(correctRoll.group._id));
				const uniqueOptions = correctRoll.group.cards.filter(card => !selectedGroupMembers.find(existing => existing.gachaCardId.equals(card._id)));
				correctRoll.pull.gachaCardId = uniqueOptions[Math.floor(rand() * uniqueOptions.length)]._id;
			}

			pulls.push(correctRoll.pull);
			existingGacha.push(correctRoll.pull);
			addRollToMap(gachaGroupMap, correctRoll.pull);
		}
	}

	console.log("write pulls", pulls[0]?.gameId);
	await mongoStore.gachaCollection.insertMany(pulls);
}
