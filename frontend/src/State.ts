import { Rest, Store } from "majsoul-api";

export interface Contest extends Omit<Store.Contest<string>, "teams" | "sessions" > {
	teams?: Record<string, ContestTeam>;
	sessions: Session[];
}

export interface Session extends Rest.Session<string> {
	games: Store.GameResult<string>[];
}

export interface IState {
	contest?: Contest;
	games?: Record<string, Store.GameResult<string>>;
	user?: {
		token: string;
	}
}

export interface ContestTeam extends Store.ContestTeam<string> {
	index: number;
}

export function findPlayerInformation(playerId: string, teams: Record<string, ContestTeam>): { team: ContestTeam; player: Store.Player; } {
	for (const teamId in teams) {
		const player = teams[teamId].players.find(player => player._id === playerId);
		if (player) {
			return {
				player,
				team: teams[teamId]
			};
		}
	}
	return null;
}
