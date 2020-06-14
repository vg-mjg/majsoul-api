export interface Player {
	_id: string;
	displayName: string[];
}

export interface Team {
	_id: string;
	name: string;
	players: Player[]
}

export interface Contest {
	_id: string;
	teams?: Record<string, Team>;
	majsoulFriendlyId: number;
	name: string;
	sessions: Session[];
}

export interface FinalScore {
	uma: number;
	score: number;
}

export interface Session {
	_id: string;
	scheduledTime: number;
	plannedMatches: {
		teams: {
			_id: string;
		}[];
	}[];
	games: any[];
	isCancelled: boolean;
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}

export interface IState {
	contest?: Contest;
}
