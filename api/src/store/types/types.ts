import * as majsoul from "../../majsoul";
import { ObjectId } from "mongodb";

export interface GameResult<Id = any> extends majsoul.GameResult {
	_id: Id;
	sessionId: Id;
	players: Player<Id>[]
}

export interface Session<Id = any> {
	_id: Id;
	scheduledTime: number;
	plannedMatches: Match<Id>[];
	isCancelled: boolean;
}

export interface Player<Id = any> extends majsoul.Player {
	_id: Id;
	displayName: string;
}

export interface Contest<Id = any> extends majsoul.Contest {
	_id: Id;
	sessions: Session<Id>[];
	teams: ContestTeam<Id>[];
}

export interface ContestTeam<Id = any> {
	_id: Id;
	name: string;
	players: Player<Id>[];
}

export interface Match<Id = any> {
	teams: {
		_id: Id;
	}[];
}
