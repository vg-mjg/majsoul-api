import { Han } from "../../majsoul/types/Han";
import { Player as MajsoulPlayer, Contest as MajsoulContest } from "../../majsoul/types/types";
import { ContestPhaseTransition } from "./ContestPhaseTransition";
import { DrawStatus } from "./DrawStatus";
import { Wind } from "./Wind";

export enum GameResultVersion {
	None,
	First,
	Second,
	Third,
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

export interface KanStatics {
	ankan: number;
	shouminkan: number;
	daiminkan: number;
	shouminkanRobbed: number;
	rinshan: number;
}

export interface CallStats {
	total: number; //chinponyas
	kans: KanStatics;
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
	han: Han[];
}

interface TsumoRecord extends AgariInfo {
	dealerValue: number;
}

interface RonRecord extends AgariInfo {
	loser: number;
}

export interface GameCorrection<Id = any> {
	_id: Id;
	gameId: Id;
	finalScore?: FinalScore[];
}

export interface GameResult<Id = any> {
	config?: {
		aiLevel: number;
		riichiStickValue?: number;
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
	hidden?: boolean;
	version?: GameResultVersion;
}

export function isAgariYakuman(
	{ config }: GameResult,
	{ dealership }: RoundInfo,
	agari: AgariInfo
): boolean {
	if (!agari) {
		return false;
	}

	let { value } = agari;
	if (agari.han.findIndex(han => han === Han.Riichi || han === Han.Double_Riichi) >= 0) {
		value += config?.riichiStickValue ?? 1000;
	}

	if (agari.winner === dealership) {
		return value >= 48000;
	}

	return value >= 32000;
}

export interface Session<Id = any> {
	name?: string;
	_id: Id;
	contestId: Id;
	scheduledTime: number;
	plannedMatches: Match<Id>[];
	isCancelled?: boolean;
}

export interface Player<Id = any> extends Partial<MajsoulPlayer> {
	_id: Id;
	majsoulFriendlyId?: number;
	displayName?: string;
}

export enum ContestType {
	Tourney,
	League,
}

export enum SupportedLocales {
	en = "en",
	ja = "ja"
}

export type LocalisedString = string | Record<SupportedLocales, string>

export interface ContestPhaseShared<Id = any> {
	_id: Id;
	tagline?: string;
	taglineAlternate?: string;
	anthem?: string;
}

export interface LeagueContestPhase<Id = any> {
	type?: ContestType.League,
	teams?: ContestTeam<Id>[];
}

export enum TourneyContestPhaseSubtype {
	Default,
	TeamQualifier
}

export enum TourneyContestScoringType {
	Cumulative,
	Consecutive,
	Kans,
}

export interface TourneyScoringTypeDetails {
	type: TourneyContestScoringType;
	typeDetails?: ConsecutiveScoringDetails;
};

export type TourneyScoringInfo = TourneyScoringTypeDetails & TourneyScoringSharedInfo;

interface TourneyScoringSharedInfo {
	places?: number;
	suborder?: TourneyScoringInfo[];
	reverse?: boolean;
}

interface ConsecutiveScoringDetails {
	findWorst?: boolean;
	gamesToCount?: number;
}

export interface TourneyContestPhase {
	type?: ContestType.Tourney;
	subtype?: TourneyContestPhaseSubtype;
	tourneyType?: TourneyContestScoringType | TourneyScoringInfo[];
	maxGames?: number;
	bonusPerGame?: number;
}

export type ContestPhase<Id = any> = ContestPhaseShared<Id> & (LeagueContestPhase<Id> & TourneyContestPhase)

export interface Contest<Id = any> extends Partial<MajsoulContest>, Omit<ContestPhase<Id>, "type"> {
	type?: ContestType
	track?: boolean;
	adminPlayerFetchRequested?: boolean;

	displayName?: string;
	notFoundOnMajsoul?: boolean;
	initialPhaseName?: string;
	spreadsheetId?: string;
	transitions?: ContestPhaseTransition<Id>[];
}

export interface ContestTeam<Id = any> {
	_id: Id;
	name?: string;
	image?: string;
	players?: Player<Id>[];
	color?: string;
	contrastBadgeFont?: boolean;
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

export interface Cookie {
	key: string;
	value: string;
	expires?: number;
}

export interface Config<Id = any> {
	_id: Id;
	featuredContest?: Id;
	googleRefreshToken?: string;
	loginCookies?: Cookie[];
}
