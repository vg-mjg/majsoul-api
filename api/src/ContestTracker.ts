import { ChangeStreamInsertDocument, ChangeStreamDocument, ObjectId, ChangeStreamUpdateDocument } from 'mongodb';
import * as store from "./store";
import { combineLatest, defer, EMPTY, from, merge, Observable, timer } from "rxjs";
import { delay, distinctUntilChanged, filter, first, map, mapTo, mergeAll, share, switchAll, takeUntil, tap, mergeMap, scan, debounce, debounceTime, throttleTime } from 'rxjs/operators';
import { Majsoul, Store } from ".";
import { nameofContest } from "./connector";
import { buildContestPhases } from './store';
import { GameRecord } from './majsoul';

export class ContestTracker {
	private contestDeleted$: Observable<any>;
	private contestUpdates$: Observable<ChangeStreamUpdateDocument<store.Contest<ObjectId>>>;
	private gamesCreated$: Observable<ChangeStreamInsertDocument<store.GameResult<ObjectId>>>;
	constructor(
		public readonly id: ObjectId,
		private readonly mongoStore: Store.Store,
		private readonly api: Majsoul.Api
	) { }

	public get ContestDeleted$(): Observable<any> {
		return this.contestDeleted$ ??= merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id }))).pipe(
				filter(contest => contest == null)
			),
			this.mongoStore.ContestChanges.pipe(
				filter(changeEvent => changeEvent.operationType === "delete"
					&& changeEvent.documentKey._id.equals(this.id))
			)
		).pipe(first(), share());
	}

	private get ContestUpdates$(): Observable<ChangeStreamUpdateDocument<store.Contest<ObjectId>>> {
		return this.contestUpdates$ ??= this.mongoStore.ContestChanges.pipe(
			filter(changeEvent => changeEvent.operationType === "update"
				&& changeEvent.documentKey._id.equals(this.id)
			),
			share()
		) as Observable<ChangeStreamUpdateDocument<store.Contest<ObjectId>>>;
	}

	private get GamesCreated$(): Observable<ChangeStreamInsertDocument<store.GameResult<ObjectId>>> {
		return this.gamesCreated$ ??= this.mongoStore.GameChanges.pipe(
			filter(changeEvent => changeEvent.operationType === "insert"
				&& changeEvent.fullDocument.contestId.equals(this.id)
			),
			share()
		) as Observable<ChangeStreamInsertDocument<store.GameResult<ObjectId>>>;
	}

	public get NotFoundOnMajsoul$(): Observable<boolean> {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.notFoundOnMajsoul ?? false)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("notFoundOnMajsoul")) >= 0),
				mapTo(false)
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.notFoundOnMajsoul !== undefined),
				map(event => event.updateDescription.updatedFields.notFoundOnMajsoul)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get MajsoulId$(): Observable<number> {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.majsoulId)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("majsoulId")) >= 0),
				mapTo(null as number)
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.majsoulId !== undefined),
				map(event => event.updateDescription.updatedFields.majsoulId)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get MajsoulFriendlyId$(): Observable<number> {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.notFoundOnMajsoul ? null as number : contest.majsoulFriendlyId)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("majsoulFriendlyId")) >= 0
					|| event.updateDescription.updatedFields?.notFoundOnMajsoul === true),
				mapTo(null as number)
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.majsoulFriendlyId !== undefined),
				map(event => event.updateDescription.updatedFields.majsoulFriendlyId)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get UpdateRequest$() {
		return this.MajsoulFriendlyId$.pipe(
			map(majsoulFriendlyId => majsoulFriendlyId == null
				? EMPTY
				: timer(0, 86400000).pipe(
					mapTo(majsoulFriendlyId),
					takeUntil(this.ContestDeleted$)
				)
			),
			switchAll()
		);
	}

	public get Track$(): Observable<boolean> {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.track ?? false)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("track")) >= 0),
				mapTo(false)
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.track !== undefined),
				map(event => event.updateDescription.updatedFields.track ?? false)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get AdminPlayerFetchRequested$(): Observable<boolean> {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.adminPlayerFetchRequested ?? false)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("adminPlayerFetchRequested")) >= 0),
				mapTo(false)
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.adminPlayerFetchRequested !== undefined),
				map(event => event.updateDescription.updatedFields.adminPlayerFetchRequested ?? false)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get LiveGames$() {
		return combineLatest([this.MajsoulId$, this.NotFoundOnMajsoul$, this.Track$]).pipe(
			map(([majsoulId, notFoundOnMajsoul, track]) => (majsoulId == null || notFoundOnMajsoul || !track)
				? EMPTY
				: this.api.subscribeToContestChatSystemMessages(majsoulId).pipe(
					filter(notification => notification.game_end && notification.game_end.constructor.name === "CustomizedContestGameEnd"),
					map(notification => notification.uuid as string),
					takeUntil(this.ContestDeleted$)
				)
			),
			switchAll(),
			delay(2000),
		);
	}

	public get RecordedGames$() {
		return merge(
			defer(() => from(this.mongoStore.gamesCollection.find({ contestId: this.id }, {sort: { start_time: 1 }}).toArray()))
				.pipe(mergeAll()),
			this.GamesCreated$.pipe(
				map(event => event.fullDocument)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get Teams$() {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.teams)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("teams")) >= 0),
				mapTo(null as store.ContestTeam<ObjectId>[])
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.teams !== undefined),
				map(event => event.updateDescription.updatedFields.teams)
			)
		).pipe(
			takeUntil(this.ContestDeleted$)
		);
	}

	public get SpreadsheetId$() {
		return merge(
			defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id })))
				.pipe(map(contest => contest.spreadsheetId)),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.removedFields.indexOf(nameofContest("spreadsheetId")) >= 0
					|| event.updateDescription.updatedFields?.notFoundOnMajsoul === true),
				mapTo(null as string)
			),
			this.ContestUpdates$.pipe(
				filter(event => event.updateDescription.updatedFields?.spreadsheetId !== undefined),
				map(event => event.updateDescription.updatedFields.spreadsheetId)
			)
		).pipe(
			distinctUntilChanged(),
			takeUntil(this.ContestDeleted$)
		);
	}

	public get PhaseInfo$() {
		const projection = {
			type: true,
			tourneyType: true,
			transitions: true,
			subtype: true,
			normaliseScores: true,
			eliminationBracketSettings: true,
			eliminationBracketTargetPlayers: true,
			gacha: true,
		};

		return merge(
			from([null]),
			this.ContestUpdates$.pipe(
				filter(event => !!event.updateDescription.removedFields.find(field => projection[field])
					|| !!Object.keys(event.updateDescription.updatedFields).find(field => projection[field])),
			),
		).pipe(
			mergeMap(() => defer(() => from(this.mongoStore.contestCollection.findOne({ _id: this.id }, { projection })))),
			map(buildContestPhases),
			filter(phases => !!phases),
			takeUntil(this.ContestDeleted$)
		);
	}

	public get GachaDeleted$(): Observable<never> {
		return this.mongoStore.GachaChanges.pipe(
			filter(changeEvent => changeEvent.operationType === "delete"),
			throttleTime(5000),
			map(() => undefined as never)
		);
	}
}
