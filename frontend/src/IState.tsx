import { Rest, Store } from "majsoul-api";

export interface Contest extends Omit<Rest.Contest<string>, "teams" | "sessions" > {
	teams?: Record<string, ContestTeam>;
	sessions: Session[];
}

export interface Session extends Rest.Session<string> {
	games: Store.GameResult<string>[];
	aggregateTotals: Record<string, number>;
}

export interface IState {
	contest?: Contest;
}

export interface ContestTeam extends Store.ContestTeam<string> {
	index: number;
}