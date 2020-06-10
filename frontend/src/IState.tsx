export interface IState {
	players?: [],

	summary?: {
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
}
