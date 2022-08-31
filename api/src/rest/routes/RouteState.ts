import * as store from '../../store';
import { GameResult, Session, ContestPlayer, Phase, PhaseMetadata, LeaguePhase, PlayerTourneyStandingInformation, YakumanInformation, TourneyPhase, PlayerRankingType, PlayerScoreTypeRanking, PlayerTeamRanking, SharedGroupRankingData, TourneyContestScoringDetailsWithId, PlayerInformation, EliminationLevel, EliminationMatchDetails, GachaData } from '../types/types';
import { ObjectId, Filter, Condition, FindOptions } from 'mongodb';
import { concat, defer, from, Observable, of, lastValueFrom } from 'rxjs';
import { map, mergeWith, mergeAll, mergeScan, pairwise, scan, toArray } from 'rxjs/operators';
import { Majsoul, Rest, Store } from '../..';
import { AgariInfo, buildContestPhases, ContestPhaseTransition, ContestType, GachaGroup, GachaPull, GameCorrection, isAgariYakuman, TourneyContestScoringType, TourneyScoringInfoPart, TourneyScoringTypeDetails } from '../../store';
import { ContestOption } from '../ContestOption';
import { PlayerContestTypeResults } from '../PlayerContestTypeResults';
import { bilateralSort } from '../utils/bilateralSort';
import { OAuth2Client } from 'google-auth-library';


export class RouteState {
	constructor(
		public mongoStore: store.Store,
		public oauth2Client: OAuth2Client,
		public privateKey: Buffer,
	) {}

	public findContest(contestId: string, options?: FindOptions): Promise<store.Contest<ObjectId>> {
		return this.mongoStore.contestCollection.findOne(
			{
				$or: [
					{ majsoulFriendlyId: parseInt(contestId) },
					{ _id: ObjectId.isValid(contestId) ? ObjectId.createFromHexString(contestId) : null },
				]
			},
			options ?? {
				projection: {
					'teams.image': false,
					sessions: false,
				}
			}
		);
	}

	public contestExists(contestId: string): Promise<ObjectId> {
		return this.findContest(contestId, { projection: { _id: true } }).then(contest => contest?._id);
	}

	public async getSessionSummary(contest: store.Contest, startSession: store.Session, endSession?: store.Session): Promise<Record<string, number>> {
		const timeWindow: Condition<number> = {
			$gte: startSession.scheduledTime
		};

		if (endSession) {
			timeWindow.$lt = endSession.scheduledTime
		}

		const games = await this.getGames({
			contestId: contest._id,
			end_time: timeWindow,
			hidden: { $ne: true }
		}, {contest});

		return games.reduce<Record<string, number>>((total, game) => {
			game.finalScore.forEach((score, index) => {
				const winningTeam = contest.teams.find(t => t.players?.find(p => p._id.equals(game.players[index]._id)));
				if (!winningTeam) {
					return;
				}
				total[winningTeam._id.toHexString()] = (total[winningTeam._id.toHexString()] ?? 0) + score.uma;
			});
			return total;
		}, contest.teams.reduce((total, next) => (total[next._id.toHexString()] = 0, total), {}));
	}

	public getSessions(contest: store.Contest<ObjectId>): Observable<Session> {
		return concat(
			defer(() => from(
				this.mongoStore.sessionsCollection.find(
					{ contestId: contest._id },
					{ sort: { scheduledTime: 1 } }
				).toArray()
			)).pipe(
				mergeAll(),
			),
			of<store.Session<ObjectId>>(null)
		).pipe(
			pairwise(),
			map(([session, nextSession]) =>
				defer(() => from(this.getSessionSummary(contest, session, nextSession)))
					.pipe(
						map(totals => {
							return { ...session, totals, aggregateTotals: totals };
						})
					)
			),
			mergeAll(),
		);
	}

	public async getPhases(contestId: string): Promise<Store.PhaseInfo<ObjectId>> {
		const contest = await this.findContest(contestId, {
			projection: {
				_id: true,
				type: true,
				tourneyType: true,
				startTime: true,
				'teams._id': true,
				'teams.players._id': true,
				transitions: true,
				initialPhaseName: true,
				maxGames: true,
				subtype: true,
				normaliseScores: true,
				eliminationBracketSettings: true,
				eliminationBracketTargetPlayers: true,
				gacha: true,
			}
		});

		return buildContestPhases(contest);
	}

	public createRestPhases(phaseInfo: Store.PhaseInfo<ObjectId>): Rest.PhaseMetadata[] {
		return phaseInfo?.phases?.map((phase, index) => ({
			name: phase.name,
			startTime: phase.startTime,
			index: phase.index,
		})) ?? [];
	}

	public async getLeaguePhaseData(phaseInfo: Store.PhaseInfo<ObjectId>): Promise<LeaguePhase<ObjectId>[]> {
		const {
			contest,
			transitions
		} = phaseInfo;
		const phases = this.createRestPhases(phaseInfo);
		const sessions = (await this.getSessions(contest).pipe(toArray()).toPromise())
			.sort((a, b) => a.scheduledTime - b.scheduledTime);
		return from(phases.concat(null)).pipe(
			pairwise(),
			mergeScan((completePhase, [phase, nextPhase]) => {
				const transition = transitions[phase.index];
				const phaseSessions = sessions.filter(
					session =>
						session.scheduledTime >= phase.startTime
						&& (nextPhase == null || session.scheduledTime < nextPhase.startTime)
				);
				const startingTotals = {
					...completePhase.sessions[completePhase.sessions.length - 1]?.aggregateTotals ?? {}
				};

				const rankedTeams = Object.entries(startingTotals)
					.map(([team, score]) => ({ team, score }))
					.sort((a, b) => b.score - a.score);

				const allowedTeams = transition.teams?.top
					? rankedTeams.slice(0, transition.teams.top)
						.reduce((total, next) => (total[next.team] = true, total), {} as Record<string, true>)
					: null;

				for (const team of Object.keys(startingTotals)) {
					if (allowedTeams && !(team in allowedTeams)) {
						delete startingTotals[team];
						continue;
					}

					if (transition.score?.half) {
						startingTotals[team] = Math.floor(startingTotals[team] / 2);
					} else if (transition.score?.nil) {
						startingTotals[team] = 0;
					}
				}

				return of({
					...phase,
					sessions: phaseSessions.reduce((total, next) => {
						const aggregateTotals = { ...(total[total.length - 1]?.aggregateTotals ?? startingTotals) };
						const filteredTotals = Object.entries(next.totals)
							.filter(([key]) => !allowedTeams || key in allowedTeams)
							.reduce((total, [key, value]) => (total[key] = value, total), {} as Record<string, number>);

						for (const team in filteredTotals) {
							if (aggregateTotals[team] == null) {
								aggregateTotals[team] = 0;
							}
							aggregateTotals[team] += filteredTotals[team];
						}

						total.push({
							...next,
							totals: filteredTotals,
							aggregateTotals,
						})
						return total;
					}, [] as Session<ObjectId>[]),
					aggregateTotals: startingTotals,
				} as LeaguePhase<ObjectId>);
			}, {
				sessions: [{
					aggregateTotals: (contest.teams ?? []).reduce(
						(total, next) => (total[next._id.toHexString()] = 0, total),
						{} as Record<string, number>
					)
				}]
			} as LeaguePhase<ObjectId>, 1),
			toArray(),
		).toPromise();
	}

	public copyScoreRanking(scoreRanking: PlayerScoreTypeRanking): PlayerScoreTypeRanking {
		const details = {
			...scoreRanking.details
		};

		for (const type in details) {
			details[type] = {...details[type]}
		}

		return {
			type: PlayerRankingType.Score,
			details
		};
	}

	public rankPlayersUsingContestRules(
		players: {
			player: SharedGroupRankingData;
			_id: string;
		}[],
		contestTypes: (TourneyScoringInfoPart & {id: string})[],
		resultsByType: Record<string, Record<string, PlayerContestTypeResults>>,
		rank = null,
	) {
		players = [...players];
		const types = [...contestTypes];
		if (rank === null) {
			const type = {type: contestTypes[0].type};
			types.push({...type, id: this.generateScoringTypeId(type)});
			rank = 1;
		}

		for (const type of types) {
			if (players.length === 0) {
				break;
			}

			const results = resultsByType[type.id];
			let takenPlayers = players
				.sort((a, b) => results[a._id].rank - results[b._id].rank);

			if (type.reverse) {
				takenPlayers.reverse();
			}

			takenPlayers = takenPlayers.splice(0, type.places ?? Infinity);

			if (type.suborder) {
				this.rankPlayersUsingContestRules(
					takenPlayers,
					[
						...type.suborder,
						{type: type.type}
					].map(type => ({...type, id: this.generateScoringTypeId(type)})),
					resultsByType,
					rank,
				);
				rank += takenPlayers.length;
				continue;
			}

			for (const player of takenPlayers) {
				player.player.rank = rank;
				player.player.qualificationType = type.id;

				rank++;
			}
		}
	}

	public generateScoringTypeId(type: TourneyScoringTypeDetails): string {
		if (type.type === TourneyContestScoringType.Consecutive) {
			return `${type.type}_${type.typeDetails?.gamesToCount ?? 5}${type.typeDetails?.findWorst == null ? "" : "_worst"}`;
		}

		return `${type.type}`;
	}

	public async namePlayers(players: store.Player<ObjectId>[], contestId: ObjectId, contest?: store.Contest): Promise<Rest.PlayerInformation[]> {
		if (!contest) {
			contest = (await this.mongoStore.contestCollection.find(
				{
					_id: contestId
				},
				{
					projection: {
						nicknameOverrides: true,
					}
				}
			).toArray())[0];
		}

		const overrides = contest?.nicknameOverrides?.reduce((total, next) => (total[next._id] = next.nickname, total), {} as Record<string, string>) ?? {};

		return players?.map(player => ({
			_id: player._id.toHexString(),
			nickname: overrides?.[player._id.toHexString()] ?? player.displayName ?? player.nickname,
			zone: Majsoul.Api.getPlayerZone(player.majsoulId),
		})) ?? [];
	}

	public getTourneyPhaseData(phaseInfo: Store.PhaseInfo<ObjectId>): Promise<TourneyPhase<ObjectId>[]> {
		const {
			contest,
			phases: storePhases
		} = phaseInfo;
		const phases = this.createRestPhases(phaseInfo);
		return lastValueFrom(from(phases).pipe(
			mergeWith(of(null as TourneyPhase<ObjectId>)),
			pairwise(),
			map(([phase, nextPhase], index) => from(this.getTourneyPhaseStandings(contest, phase, nextPhase, storePhases[index])).pipe(
				map(standings => ({
					...phase,
					...standings
				}))
			)),
			mergeAll(),
			toArray()
		));
	};

	public async getTourneyPhaseStandings(
		contest: Store.Contest<ObjectId>,
		phase: TourneyPhase<ObjectId>,
		nextPhase: TourneyPhase<ObjectId>,
		storePhase: Store.ContestPhase<ObjectId>,
	): Promise<{
		standings: PlayerTourneyStandingInformation[];
		scoringTypes: (TourneyScoringInfoPart & {id:string})[];
		eliminationLevels?: EliminationLevel[];
	}> {
		const contestTypes: (TourneyScoringInfoPart & {id:string})[] = (
			Array.isArray(storePhase.tourneyType)
				? storePhase.tourneyType
				: [ { type: storePhase.tourneyType ?? TourneyContestScoringType.Cumulative } ]
		).map(type => ({...type, id: this.generateScoringTypeId(type)}));

		const scoreTypeSet: Record<string, TourneyContestScoringDetailsWithId> = {};
		const scoreTypeLevels = [...contestTypes];
		while (scoreTypeLevels.length > 0) {
			const scoreTypeLevel = scoreTypeLevels.pop();
			const id = this.generateScoringTypeId(scoreTypeLevel);
			if (!(id in scoreTypeSet)) {
				scoreTypeSet[id] = {
					type: scoreTypeLevel.type,
					typeDetails: scoreTypeLevel.typeDetails,
					id,
				}
			};

			if (scoreTypeLevel.suborder) {
				scoreTypeLevels.push(
					...scoreTypeLevel.suborder?.map(type => ({...type, id: this.generateScoringTypeId(type)}))
				);
			}
		}

		const scoringTypes = Object.values(scoreTypeSet);

		const games = await this.adjustGames(
			await this.mongoStore.gamesCollection.find(
				{
					contestId: contest._id,
					end_time: {
						$gte: phase.startTime,
						$lt: nextPhase?.startTime ?? Number.POSITIVE_INFINITY
					}
				},
				{
					sort: {
						end_time: 1
					}
				}
			).toArray(),
			{contest}
		);

		const resultsByType = {} as Record<string, Record<string, PlayerContestTypeResults>>;
		const maxGames = contest.maxGames ?? Infinity;
		let eliminationLevels : EliminationLevel[];
		for (const type of scoringTypes) {
			switch (type.type) {
				case TourneyContestScoringType.Consecutive: {
					resultsByType[type.id] = this.getConsectutiveResults(type, games, maxGames);
					break;
				} case TourneyContestScoringType.Cumulative: {
					resultsByType[type.id] = this.getCumulativeResults(games, maxGames);
					break;
				} case TourneyContestScoringType.Kans: {
					resultsByType[type.id] = this.getKanResults(games, maxGames);
					break;
				} case TourneyContestScoringType.EliminationBrackets: {
					eliminationLevels = await this.getEliminationLevels(contest, storePhase, games);
					resultsByType[type.id] = this.getEliminationBracketResults(eliminationLevels);
					break;
				} case TourneyContestScoringType.Gacha: {
					resultsByType[type.id] = await this.getGachaResults(games, maxGames, contest);
					break;
				}
			}
		}

		let players = await this.namePlayers(
			await this.mongoStore.playersCollection.find({
				_id: { $in: Object.keys(resultsByType[contestTypes[0].id]).map(ObjectId.createFromHexString) }
			}).toArray(),
			null,
			contest
		);

		const playerResults = players.map<PlayerTourneyStandingInformation>(player => ({
			player,
			rank: 0,
			totalMatches: resultsByType[contestTypes[0].id][player._id].totalMatches,
			qualificationType: contestTypes[0].id,
			rankingDetails: {
				type: PlayerRankingType.Score,
				details: scoringTypes.reduce((total, type) => {
					const result = resultsByType[type.id][player._id];
					total[type.id] = {
						score: result.score,
						highlightedGameIds: result.highlightedGameIds,
						rank: result.rank,
					};
					if (result.gachaPulls) {
						total[type.id].gachaData = result.gachaPulls;
					}
					return total;
				}, {} as PlayerScoreTypeRanking['details'])
			}
		})).reduce(
			(total, next) => (total[next.player._id] = next, total),
			{} as Record<string, PlayerTourneyStandingInformation>
		)

		this.rankPlayersUsingContestRules(
			Object.values(playerResults).map(player => ({
				_id: player.player._id,
				player: player
			})),
			contestTypes,
			resultsByType
		);

		if (phase.subtype === store.TourneyContestPhaseSubtype.TeamQualifier && contest.teams) {
			const freeAgents = players.filter(player => !contest.teams.find(team => team.players?.find(teamPlayer => player._id === teamPlayer._id.toHexString())))
				.map(player => playerResults[player._id]);

			const scoreRankings = {} as Record<string, PlayerScoreTypeRanking>;
			const teams = [
				{
					id: null,
					playerIds: players.map(player => player._id)
				},
				...contest.teams.map(team => ({
					id: team._id.toHexString(),
					playerIds: team.players?.map(player => player._id.toHexString())
				}))
			];

			for (const team of teams) {
				const teamPlayerResults = [
					...team.playerIds?.map(player => playerResults[player]),
					...freeAgents
				].filter(player => player) ?? [];
				for (const result of teamPlayerResults) {
					if (result.rankingDetails.type !== PlayerRankingType.Team) {
						scoreRankings[result.player._id] = result.rankingDetails;
						result.rankingDetails = {
							type: PlayerRankingType.Team,
							details: {}
						}
					}

					result.rankingDetails.details[team.id] = {
						rank: 0,
						qualificationType: null,
						scoreRanking: this.copyScoreRanking(scoreRankings[result.player._id])
					}
				}

				for (const scoreType of [...scoringTypes]) {
					teamPlayerResults.sort((a, b) => scoreRankings[a.player._id].details[scoreType.id].rank - scoreRankings[b.player._id].details[scoreType.id].rank);
					let rank = 1;
					for (const player of teamPlayerResults) {
						if (player.rankingDetails.type !== PlayerRankingType.Team) {
							continue;
						}

						player.rankingDetails.details[team.id].scoreRanking.details[scoreType.id].rank = rank;
						rank++;
					}
				}

				this.rankPlayersUsingContestRules(
					Object.values(teamPlayerResults).map(player => ({
						_id: player.player._id,
						player: (player.rankingDetails as PlayerTeamRanking).details[team.id]
					})),
					contestTypes,
					resultsByType
				);
			}
		}

		for (const result of Object.values(playerResults)) {
			if (result.hasMetRequirements) {
				continue;
			}

			const type = scoreTypeSet[result.qualificationType];

			const targetGames = type.type === TourneyContestScoringType.Consecutive
				? (type.typeDetails?.gamesToCount ?? 5)
				: contest.maxGames;

			if (Number.isNaN(targetGames)) {
				continue;
			}

			if (result.totalMatches < contest.maxGames) {
				continue;
			}

			result.hasMetRequirements = true;
		}

		return {
			scoringTypes,
			standings: Object.values(playerResults).sort((a, b) => a.rank - b.rank),
		}
	}

	public getConsectutiveResults(
		scoringDetails: TourneyScoringTypeDetails,
		games: GameResult[],
		maxGames: number
	): Record<string, PlayerContestTypeResults> {
		const gamesToCount = scoringDetails?.typeDetails?.gamesToCount ?? 5;
		const scoreFlip = scoringDetails?.typeDetails?.findWorst ? -1 : 1;
		const playerResults = games.reduce((total, next) => {
			for (let seat = 0; seat < next.players.length; seat++) {
				if (!next.players[seat]) {
					continue;
				}

				const playerId = next.players[seat]._id.toHexString();
				const playerData = total[playerId] ??= {
					score: 0,
					maxScore: 0,
					totalMatches: 0,
					maxSequence: [],
					currentSequence: []
				};

				if (playerData.totalMatches >= maxGames) {
					continue;
				}

				playerData.totalMatches++;
				const score = next.finalScore[seat].uma;
				playerData.currentSequence.push({
					id: next._id.toHexString(),
					score
				});
				playerData.score += score;
				if (playerData.totalMatches > gamesToCount) {
					const removedGame = playerData.currentSequence.shift();
					playerData.score -= removedGame.score
					if (playerData.score * scoreFlip > playerData.maxScore * scoreFlip) {
						playerData.maxScore = playerData.score;
						playerData.maxSequence = playerData.currentSequence.map(game => game.id)
					}
				} else {
					playerData.maxSequence.push(next._id.toHexString());
					playerData.maxScore = playerData.score
				}
			}
			return total;
		}, {} as Record<string, {
			totalMatches: number,
			score: number,
			maxScore: number,
			rank?: number,
			maxSequence: string[],
			currentSequence: {
				id: string,
				score: number,
			}[]
		}>);

		return Object.entries(playerResults)
			.sort(([, a], [, b]) => b.maxScore - a.maxScore)
			.map((result, index) => {
				result[1].rank = index + 1;
				return result;
			})
			.reduce((total, [id, result]) => {
			total[id] = {
				playerId: id,
				rank: result.rank,
				score: result.maxScore,
				totalMatches: result.totalMatches,
				highlightedGameIds: result.maxSequence,
			};
			return total;
		}, {} as Record<string, PlayerContestTypeResults>);
	}

	public getCumulativeResults(games: GameResult[], maxGames: number): Record<string, PlayerContestTypeResults> {
		const playerResults = games.reduce((total, next) => {
			for (let seat = 0; seat < next.players.length; seat++) {
				if (!next.players[seat]) {
					continue;
				}

				const playerId = next.players[seat]._id.toHexString();
				const playerData = total[playerId] ??= {
					score: 0,
					totalMatches: 0,
					highlightedGameIds: [],
				};

				if (playerData.highlightedGameIds.length < maxGames) {
					playerData.highlightedGameIds.push(next._id.toHexString());
				}

				playerData.totalMatches++;
				const score = next.finalScore[seat].uma;
				if (playerData.totalMatches <= maxGames) {
					playerData.score += score;
				}
			}
			return total;
		}, {} as Record<string, {
			totalMatches: number;
			rank?: number;
			score: number;
			highlightedGameIds: string[];
		}>);

		return Object.entries(playerResults)
			.sort(([, {score: scoreA}], [, {score: scoreB}]) => scoreB - scoreA)
			.map((result, index) => {
				result[1].rank = index;
				return result;
			})
			.reduce((total, [id, result]) => {
			total[id] = {
				playerId: id,
				rank: result.rank + 1,
				score: result.score,
				totalMatches: result.totalMatches,
				highlightedGameIds: result.highlightedGameIds
			};
			return total;
		}, {} as Record<string, PlayerContestTypeResults>);
	}

	public getKanResults(games: GameResult[], maxGames: number): Record<string, PlayerContestTypeResults> {
		const playerResults = games.reduce((total, next) => {
			for (let seat = 0; seat < next.players.length; seat++) {
				if (!next.players[seat]) {
					continue;
				}

				const playerId = next.players[seat]._id.toHexString();
				const playerData = total[playerId] ??= {
					score: 0,
					totalMatches: 0,
					gamesWithKans: [],
				};

				playerData.totalMatches++;

				if (playerData.totalMatches > maxGames) {
					continue;
				}

				const score = next.rounds?.reduce((total, next) => {
					const kans = next.playerStats[seat].calls.kans;
					if (!kans) {
						return total;
					}
					return total + kans.ankan + kans.daiminkan + kans.shouminkan - kans.shouminkanRobbed;
				}, 0) ?? 0;


				playerData.score += score;
				if (score > 0) {
					playerData.gamesWithKans.push(next._id);
				}
			}
			return total;
		}, {} as Record<string, {
			totalMatches: number,
			gamesWithKans: string[],
			rank?: number,
			score: number,
		}>);

		return Object.entries(playerResults)
			.sort(([, {score: scoreA}], [, {score: scoreB}]) => scoreB - scoreA)
			.map((result, index) => {
				result[1].rank = index;
				return result;
			})
			.reduce((total, [id, result]) => {
			total[id] = {
				playerId: id,
				rank: result.rank + 1,
				score: result.score,
				highlightedGameIds: result.gamesWithKans,
				totalMatches: result.totalMatches,
			};
			return total;
		}, {} as Record<string, PlayerContestTypeResults>);
	}

	public async getGachaResults(games: GameResult[], maxGames: number, contest: store.Contest): Promise<Record<string, PlayerContestTypeResults>> {
		const results = this.getCumulativeResults(games, maxGames);
		const rolls = await this.mongoStore.gachaCollection.find({
			gameId: { $in: games.map(game => game._id) },
			playerId: { $exists: true },
		}).toArray();

		const groupMap = contest.gacha.groups.reduce((total, next) => (total[next._id.toHexString()] = next, total), {} as Record<string, GachaGroup>);

		const rollsPerPlayer = rolls.reduce((total, next) => {
			const playerId = next.playerId.toHexString();
			total[playerId] ??= [];
			total[playerId].push(next);
			return total
		}, {} as Record<string, GachaPull<ObjectId>[]>);

		const players = Object.values(results);

		for (const playerId in rollsPerPlayer) {
			bilateralSort(
				rollsPerPlayer[playerId],
				(roll) => groupMap[roll.gachaGroupId.toHexString()].priority
			);
		}

		for (const group of contest.gacha.groups.sort((a, b) => b.priority - a.priority)) {
			bilateralSort(
				players,
				(player) => rollsPerPlayer[player.playerId]?.filter(roll => roll.gachaGroupId.equals(group._id))?.length ?? 0
			)
		}

		players.forEach((player, index) => {
			player.rank = index + 1;
			player.gachaPulls = [];

			if (!rollsPerPlayer[player.playerId]) {
				return;
			}

			let group = [] as GachaPull<ObjectId>[];
			while (true) {
				const pull = rollsPerPlayer[player.playerId].pop();
				if (group[0]?.gachaGroupId && !group[0].gachaGroupId.equals(pull?.gachaGroupId)) {
					player.gachaPulls.push({
						name: groupMap[group[0]?.gachaGroupId.toHexString()].name,
						cards: group.map(card => card.gachaCardId.toHexString()),
					})
					group = [];
				}

				if (!pull) {
					break;
				}

				group.push(pull);
			}
		});
		return results;
	}

	public async getEliminationLevels(contest: store.Contest<ObjectId>, phase: Store.ContestPhase<ObjectId>, games: GameResult[]): Promise<EliminationLevel[]> {
		const eliminationLevels: EliminationLevel[] = [];
		const targetPlayers = phase.eliminationBracketTargetPlayers ?? 32;

		let gamesPerMatch = 1;
		let winnersPerMatch = 2;
		let currentPlayers = 1;
		do {
			const levelIndex = eliminationLevels.length;

			gamesPerMatch = phase.eliminationBracketSettings?.[levelIndex]?.gamesPerMatch ?? gamesPerMatch;
			winnersPerMatch = phase.eliminationBracketSettings?.[levelIndex]?.winnersPerMatch ?? winnersPerMatch;

			const level = {
				levelNumber: levelIndex,
				completedMatches: [],
				requiredMatches: Math.ceil(currentPlayers / winnersPerMatch),
				winnersPerMatch,
				gamesPerMatch,
			};

			currentPlayers = level.requiredMatches * 4;

			eliminationLevels.push(level);
		} while(currentPlayers < targetPlayers);

		const eliminationLevelsReversed = [...eliminationLevels];
		const gamesCopy = [...games];

		const playerNameRequest = {} as Record<string, EliminationMatchDetails[]>;

		while (eliminationLevelsReversed.length && gamesCopy.length) {
			const level = eliminationLevelsReversed.pop();
			const matches = {} as Record<string, EliminationMatchDetails>;
			while (level.completedMatches.length < level.requiredMatches) {
				const game = gamesCopy.shift();
				const matchId = game.players.map(player => player._id.toHexString()).sort().reduce((total, id) => total + id, "");

				if (!(matchId in matches)) {
					matches[matchId] = {
						games: [],
						players: [],
					};

					for (const player of game.players) {
						playerNameRequest[player._id.toHexString()] ??= [];
						playerNameRequest[player._id.toHexString()].push(matches[matchId]);
					}

				}

				matches[matchId].games.push(game);

				if (matches[matchId].games.length >= level.gamesPerMatch) {
					level.completedMatches.push(matches[matchId]);
				}

				if (!gamesCopy.length) {
					break;
				}
			}
		}

		const players = await this.mongoStore.playersCollection.find({
			_id: { $in: Object.keys(playerNameRequest).map(ObjectId.createFromHexString) }
		}).toArray();

		for (const player of await this.namePlayers(players, contest._id, contest)) {
			for (const request of playerNameRequest[player._id]) {
				request.players.push(player);
			}
		}

		return eliminationLevels;
	}

	public getEliminationBracketResults(eliminationLevels: EliminationLevel[]): Record<string, PlayerContestTypeResults> {
		const results = {} as Record<string, PlayerContestTypeResults>;
		let rank = 0;
		const losers = [] as {score: number, player: PlayerInformation}[];
		for (const level of eliminationLevels) {
			for (const match of level.completedMatches) {
				const scores = match.players.reduce(
					(total, next) => (total[next._id] = {score: 0, player: next}, total),
					{} as Record<string, {score: number, player: PlayerInformation}>
				);

				for (const game of match.games) {
					game.players.forEach((player, index) => {
						const playerId = player._id.toHexString();
						scores[playerId].score += game.finalScore[index].uma;
						results[playerId] ??= {
							playerId,
							rank: 0,
							score: 0,
							totalMatches: 0,
							highlightedGameIds: []
						}
						results[playerId].totalMatches++;
						results[playerId].highlightedGameIds.push(game._id.toHexString());
					});
				}

				const sortedPlayers = Object.values(scores).sort((a, b) => b.score - a.score);

				losers.push(...sortedPlayers.slice(level.levelNumber === 0 ? 0 : level.winnersPerMatch));
			}

			losers.sort((a, b) => b.score - a.score);

			while (losers.length) {
				const loser = losers.shift();
				results[loser.player._id].rank = ++rank;
				results[loser.player._id].score = loser.score;
			}

			if (level.completedMatches.length < level.requiredMatches) {
				rank += 4 * (level.requiredMatches - level.completedMatches.length);
			}
		}

		return results;
	}

	public async adjustGames(games: store.GameResult<ObjectId>[], options?: ContestOption): Promise<store.GameResult<ObjectId>[]> {
		const corrections = await this.mongoStore.gameCorrectionsCollection.find({
			gameId: {
				$in: games.map(game => game._id)
			}
		}).toArray();

		if (corrections.length) {
			const gameMap = games.reduce(
				(total, next) => (total[next._id.toHexString()] = next, total),
				{} as Record<string, store.GameResult<ObjectId>>
			);

			for (const correction of corrections) {
				const game = gameMap[correction.gameId.toHexString()];
				for(let i = 0; i < game.finalScore.length; i++) {
					const umaCorrection = correction.finalScore[i].uma
					if (!isNaN(umaCorrection)) {
						game.finalScore[i].uma += umaCorrection;
					}

					const scoreCorrection = correction.finalScore[i].score
					if (!isNaN(scoreCorrection)) {
						game.finalScore[i].score += scoreCorrection;
					}
				}
			}
		}

		let contest = options?.contest;
		if (contest == null) {
			if (!options?.contestId) {
				return games;
			}

			const [existingContest] = await this.mongoStore.contestCollection.find(
				{_id: options.contestId},
				{
					projection: {
						normaliseScores: true,
					}
				}
			).toArray();

			if (!existingContest) {
				return games;
			}

			contest = existingContest;
		}

		if (contest.normaliseScores) {
			for (const game of games) {
				const lowestScore = game.finalScore.reduce((lowest, next) => (lowest < next.uma ? lowest : next.uma), Number.POSITIVE_INFINITY);
				for (const score of game.finalScore) {
					score.uma -= lowestScore;
				}
			}
		}

		return games;
	}

	public async getGames(query: Filter<store.GameResult<ObjectId>>, options?: ContestOption): Promise<store.GameResult<ObjectId>[]> {
		const games = await this.mongoStore.gamesCollection.find(query).toArray();
		return await this.adjustGames(games, {
			contestId: Array.isArray(query.contestId) ? null : query.contestId as ObjectId,
			...options
		});
	}
}
