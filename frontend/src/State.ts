import { Rest, Store } from "majsoul-api";

export interface Contest extends Omit<Store.Contest<string>, "teams" > {
	teams?: Record<string, Store.ContestTeam>;
	sessionsById: Record<string, Rest.Session<string>>;
	players?: Rest.ContestPlayer[];
}

export interface IState {
	contestsById: Record<string, Contest>;
	games?: Record<string, Rest.GameResult<string>>;
	user?: {
		token: string;
	};
}

export function findPlayerInformation(playerId: string, teams: Record<string, Store.ContestTeam>): { team: Store.ContestTeam; player: Store.Player; } {
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
