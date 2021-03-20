import { Han } from "./Han";
import { Wind } from "./Wind";
import { DrawStatus } from "./DrawStatus";

export interface FinalScore {
	uma: number;
	score: number;
}

export interface Player {
	majsoulId: number;
	nickname: string;
}

export interface Contest {
	majsoulId: number;
	majsoulFriendlyId: number;
	name: string;
	createdTime: number;
	startTime: number;
	finishTime: number;
}

export interface GameResult {
	contestMajsoulId: number;
	majsoulId: string;
	start_time: number;
	end_time: number;
	players: Player[];
	finalScore: FinalScore[];
	rounds: RoundResult[];
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

export interface RoundInfo {
	round: Wind;
	dealership: Wind;
	repeat: number;
}

export interface RoundResult {
	round: RoundInfo;
	draw?: DrawRecord;
	tsumo?: TsumoRecord;
	rons?: RonRecord[];
}
