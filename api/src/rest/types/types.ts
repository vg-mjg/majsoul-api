import { Store } from "../..";
import { Session as StoreSession, GameResult as StoreGameResult, Player } from "../../store/types/types";

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

export interface Phase<Id = string> extends PhaseMetadata<Id> {
	sessions: Session<Id>[];
	aggregateTotals?: Record<string, number>;
}

export interface Contest<Id = any> extends Store.Contest<Id> {
	phases: PhaseMetadata[];
}
