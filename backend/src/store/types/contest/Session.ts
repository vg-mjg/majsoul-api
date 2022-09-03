import { Match } from "./Match.js";

export interface Session<Id = any> {
	name?: string;
	_id?: Id;
	contestId: Id;
	scheduledTime: number;
	plannedMatches: Match<Id>[];
	isCancelled?: boolean;
}
