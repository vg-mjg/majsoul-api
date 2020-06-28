import { Contest as StoreContest, Session as StoreSession, GameResult as StoreGameResult } from "../../store/types/types";

export interface GameResult<Id = any> extends StoreGameResult<Id> {
	sessionId: Id;
}

export interface Session<Id = any> extends StoreSession<Id> {
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}