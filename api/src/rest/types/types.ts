import { Contest as StoreContest, Session as StoreSession, GameResult as StoreGameResult, Player } from "../../store/types/types";

export interface GameResult<Id = any> extends StoreGameResult<Id> {
	sessionId: Id;
}

export interface Session<Id = any> extends StoreSession<Id> {
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}

export interface ContestPlayer<Id = any> extends Player<Id> {
	tourneyScore: number;
	tourneyRank: number;
}
