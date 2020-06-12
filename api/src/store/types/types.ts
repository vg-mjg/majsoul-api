import * as majsoul from "../../majsoul";
import { ObjectId } from "mongodb";

export interface GameResult extends majsoul.GameResult {
	_id: ObjectId;
	players: Player[]
}

export interface Session {
	scheduledTime: number;
	plannedMatches: Match[];
	isCancelled: boolean;
	games: GameResult[];
}

export interface Player extends majsoul.Player {
	_id: ObjectId;
	displayName: string;
}

export interface Contest extends majsoul.Contest {
	_id: ObjectId;
	sessions: Session[];
	teams: ContestTeam[];
}

export interface ContestTeam {
	_id: ObjectId;
	name: string;
	players: Player[];
}

interface Match {
	teams: ContestTeam[];
}