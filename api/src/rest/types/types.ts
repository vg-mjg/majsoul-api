import { Store } from "../..";
import { Han, PlayerZone } from "../../majsoul";
import { Session as StoreSession, GameResult as StoreGameResult, Player, TourneyContestScoringType, TourneyContestPhaseSubtype, TourneyScoringTypeDetails, ContestType } from "../../store/types/types";

export * from "./stats";

export interface GameResult<Id = any> extends StoreGameResult<Id> {
	sessionId?: Id;
	contestId: Id;
}

export interface Session<Id = any> extends StoreSession<Id> {
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}

export interface ContestPlayer<Id = any> extends Player<Id> {
	tourneyScore: number;
	tourneyRank: number;
	gamesPlayed: number;
	team: {
		teams: Array<string>;
		seeded: boolean;
	}
}

export interface PhaseMetadata<Id = string> {
	index: number;
	startTime: number;
	name: string;
}

export interface LeaguePhase<Id = string> extends PhaseMetadata<Id> {
	sessions?: Session<Id>[];
	aggregateTotals?: Record<string, number>;
}

export interface PlayerInformation {
	_id: string;
	nickname: string;
	zone: PlayerZone;
}

export enum PlayerRankingType {
	Score,
	Team,
}

export type TourneyContestScoringDetailsWithId = TourneyScoringTypeDetails & {id: string};

export interface GachaData {
	name: string;
	cards: string[];
}

export interface PlayerScoreTypeRanking {
	type: PlayerRankingType.Score;
	details: Record<string, {
		rank: number;
		score: number;
		highlightedGameIds?: string[];
		gachaData?: GachaData[];
	}>;
}

export interface SharedGroupRankingData {
	rank: number;
	qualificationType: string;
}

export interface PlayerTeamRanking {
	type: PlayerRankingType.Team;
	details: Record<string, SharedGroupRankingData & {
		scoreRanking: PlayerScoreTypeRanking;
	}>
}

export interface EliminationMatchDetails {
	players: PlayerInformation[];
	games: Store.GameResult[];
}

export interface EliminationLevel {
	levelNumber: number;
	gamesPerMatch: number;
	completedMatches: EliminationMatchDetails[];
	requiredMatches: number;
	winnersPerMatch: number;
}

export type PlayerTourneyStandingInformation = SharedGroupRankingData & {
	player: PlayerInformation;
	hasMetRequirements?: boolean;
	totalMatches: number;
	rankingDetails: PlayerScoreTypeRanking | PlayerTeamRanking;
}

export interface TourneyPhase<Id = string> extends PhaseMetadata<Id> {
	scoringTypes?: TourneyContestScoringDetailsWithId[];
	standings?: PlayerTourneyStandingInformation[];
	subtype?: TourneyContestPhaseSubtype;
	eliminationLevels?: EliminationLevel[];
}

export type Phase<Id = string> = LeaguePhase<Id> | TourneyPhase<Id>;

export type Contest<Id = any> = Omit<Omit<Store.Contest<Id>, "teams">, "type"> & {
	type?: ContestType;
	phases: PhaseMetadata[];
	teams?: (Omit<Store.ContestTeam<Id>, "players"> & {
		players: PlayerInformation[]
	})[];
}

export interface YakumanInformation {
	han: Han[];
	player: PlayerInformation;
	game: {
		majsoulId: string;
		endTime: number;
	}
}
