export interface IFinalScore {
	uma: number;
	score: number;
}

export interface IContestTeam {
	name: string;
	_id: string;
	players: IPlayer[];
}

export interface IPlayer {
	majsoulId: number;
	nickname: string;
	displayName: string;
}

export interface IMatch {
	teams: IContestTeam[];
}

export interface ISession {
	scheduledTime: number;
	plannedMatches: IMatch[];
	isCancelled: boolean;
	games: IGameResult[];
}

export interface IContest {
	majsoulId: number;
	contestId: number;
	sessions: ISession[];
	name: string;
	teams: IContestTeam[];
}

export interface IGameResult {
	contestId: string;
	majsoulId: string;
	start_time: number;
	end_time: number;
	players: {
		name: string;
		majsoulId: number;
	}[];
	finalScore: IFinalScore[];
	rounds: IRoundResult[];
}

import { Han } from "./api/src/Han";

export enum Wind {
	East = 0,
	South,
	West,
	North,
}

export enum DrawStatus {
	Noten,
	Tenpai,
	Nagashi_Mangan,
}

interface IDrawRecord {
	playerDrawStatus: DrawStatus[];
}

export interface IAgariInfo {
	extras: number;
	winner: number;
	value: number;
	han: Han[];
}

interface ITsumoRecord extends IAgariInfo {
	dealerValue: number;
}

interface IRonRecord extends IAgariInfo {
	loser: number;
}

export interface IRoundInfo {
	round: Wind;
	dealership: Wind;
	repeat: number;
}

export interface IRoundResult {
	round: IRoundInfo;
	draw?: IDrawRecord;
	tsumo?: ITsumoRecord;
	rons?: IRonRecord[];
}
