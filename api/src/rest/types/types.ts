import { Contest as StoreContest, Session as StoreSession, ContestTeam } from "../../store/types/types";

export interface Contest<Id = any> extends StoreContest<Id> {
	sessions: Session<Id>[];
}

export interface Session<Id = any> extends StoreSession<Id> {
	totals: Record<string, number>;
}