export interface ISummary {
	name: string;
	contestId: number;
	teams: {
		id: string;
		name: string;
	}[];
	sessions: {
		startTime: number;
		standings: {
			[key:string]: number
		}
	}[];
}

export interface IState {
	players?: [];
	summary?: ISummary;
}
