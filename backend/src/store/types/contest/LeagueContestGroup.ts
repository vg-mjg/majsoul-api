
export interface LeagueContestGroup<Id = any> {
	name: string;
	image: string;
	teams: {
		id: Id;
	}[];
}
