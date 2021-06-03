import * as majsoul from "../../majsoul";
import { ContestPhaseTransition } from "./ContestPhaseTransition";
import { DrawStatus } from "./DrawStatus";
import { Wind } from "./Wind";

export enum GameResultVersion {
	None,
	First,
}

export const latestGameResultVersion = Object.values(GameResultVersion).length / 2 - 1 as GameResultVersion;
export interface FinalScore {
	uma: number;
	score: number;
}

export interface RoundInfo {
	round: Wind;
	dealership: Wind;
	repeat: number;
}

export interface CallStats {
	total: number; //chinponyas
	opportunities: number; //opportunities
	repeatOpportunities: number; //'' including subsequent shouminkan/ankan chances
}

export enum HandStatus {
	Open,
	Closed,
	Riichi,
}

export interface PlayerStats {
	haipaiShanten: number;
	calls: CallStats;
	finalHandState: HandState;
}

export interface OpenHandState {
	status: HandStatus.Open;
}

export interface ClosedHandState {
	status: HandStatus.Closed;
}

export interface RiichiHandState {
	status: HandStatus.Riichi;
	furiten?: boolean;
	index: number;
}

export type HandState = OpenHandState | RiichiHandState | ClosedHandState;

export interface RoundResult {
	round: RoundInfo;
	draw?: DrawRecord;
	tsumo?: TsumoRecord;
	rons?: RonRecord[];
	playerStats: PlayerStats[];
}

interface DrawRecord {
	playerDrawStatus: DrawStatus[];
}

export interface AgariInfo {
	extras: number;
	winner: number;
	value: number;
	han: majsoul.Han[];
}

interface TsumoRecord extends AgariInfo {
	dealerValue: number;
}

interface RonRecord extends AgariInfo {
	loser: number;
}


export interface GameResult<Id = any> {
	config?: {
		aiLevel: number;
	}
	contestMajsoulId?: number;
	majsoulId: string;
	start_time?: number;
	end_time?: number;
	finalScore?: FinalScore[];
	rounds?: RoundResult[];
	_id: Id;
	contestId: Id;
	players?: Player<Id>[];
	notFoundOnMajsoul?: boolean;
	version?: GameResultVersion;
}

export interface Session<Id = any> {
	name?: string;
	_id: Id;
	contestId: Id;
	scheduledTime: number;
	plannedMatches: Match<Id>[];
	isCancelled?: boolean;
}

export interface Player<Id = any> extends Partial<majsoul.Player> {
	_id: Id;
	majsoulFriendlyId?: number;
	displayName?: string;
}

export enum ContestType {
	Tourney,
	League,
}

export interface Contest<Id = any> extends Partial<majsoul.Contest> {
	type?: ContestType;
	_id: Id;
	transitions?: ContestPhaseTransition<Id>[];
	teams?: ContestTeam<Id>[];
	anthem?: string;
	tagline?: string;
	taglineAlternate?: string;
	maxGames?: number;
	displayName?: string;
	notFoundOnMajsoul?: boolean;
	bonusPerGame?: number;
	track?: boolean;
	spreadsheetId?: string;
}

export interface ContestTeam<Id = any> {
	_id: Id;
	name?: string;
	image?: string;
	players?: Player<Id>[];
	color?: string;
	anthem?: string;
}

export interface MatchTeam<Id = any> {
	_id: Id;
}

export interface Match<Id = any> {
	teams: MatchTeam<Id>[];
}

export interface User<Id = any> {
	_id: Id;
	nickname: string;
	password: {
		salt: string;
		hash: string;
	};
	scopes: string[];
}

export interface Config<Id = any> {
	_id: Id;
	featuredContest?: Id;
	googleRefreshToken?: string;
}
