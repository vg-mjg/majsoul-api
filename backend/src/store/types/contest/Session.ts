interface Match<Id = any> {
	teams: {
		_id: Id;
	}[];
}

export interface Session<Id = any> {
	name?: string;
	_id?: Id;
	contestId: Id;
	scheduledTime: number;
	plannedMatches: Match<Id>[];
	isCancelled?: boolean;
}
