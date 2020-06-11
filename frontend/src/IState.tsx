export interface ITeam {
	name: string;
}

export interface IPendingSession {
	scheduledTime: number;
	plannedMatches: {
		teams: {
			id: string;
		}[];
	}[];
}

export interface ISummary {
	name: string;
	contestId: number;

	teams: Record<string, ITeam>;

	results: {
		startTime: number;
		standings: {
			[key:string]: number
		}
	}[];

	recentSession: {
		scheduledTime: number;
		games: {
			players: {
				displayName: string;
			}[];
			finalScore: {
				score: number;
				uma: number;
			}[]
		}[];
	}

	nextSession: IPendingSession;
}

export interface IState {
	players?: [];
	summary?: ISummary;
}
