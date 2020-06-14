import { Rest, Store } from "majsoul-api";

export interface Contest extends Omit<Rest.Contest<string>, "teams" | "sessions" > {
	teams?: Record<string, Store.ContestTeam<string>>;
	sessions: Session[];
}

export interface Session extends Rest.Session<string> {
	games: Store.GameResult<string>[];
	aggregateTotals: Record<string, number>;
}

export interface IState {
	contest?: Contest;
}
