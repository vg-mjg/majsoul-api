export interface IPlayer {
	_id: string[];
	displayName: string[];
}

export interface ITeam {
	id: string;
	name: string;
	players: IPlayer[]
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

export interface IContest {
	teams?: Record<string, ITeam>;
}

export interface IState {
	players?: [];
	contest?: IContest;
	summary?: ISummary;
}
