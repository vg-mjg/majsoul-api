export interface IPlayer {
	_id: string[];
	displayName: string[];
}

export interface Team {
	_id: string;
	name: string;
	players: IPlayer[]
}

export interface PendingSession {
	scheduledTime: number;
	plannedMatches: {
		teams: {
			id: string;
		}[];
	}[];
}

export interface Contest {
	_id: string;
	teams?: Record<string, Team>;
	majsoulFriendlyId: number;
	name: string;
	sessions: Session[];
}

export interface Session {
	_id: string;
	scheduledTime: number;
	plannedMatches: {
		teams: {
			_id: string;
		}[];
	}[];
	isCancelled: boolean;
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}

export interface IState {
	contest?: Contest;
}
