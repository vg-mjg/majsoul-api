import { Store } from "../..";
import { Han, PlayerZone } from "../../majsoul";
import { Session as StoreSession, GameResult as StoreGameResult, Player } from "../../store/types/types";

export * from "./stats";

export interface GameResult<Id = any> extends StoreGameResult<Id> {
	sessionId?: Id;
	contestId: Id;
}

export interface Session<Id = any> extends StoreSession<Id> {
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}

export interface ContestPlayer<Id = any> extends Player<Id> {
	tourneyScore: number;
	tourneyRank: number;
	gamesPlayed: number;
	team: {
		teams: Array<string>;
		seeded: boolean;
	}
}

export interface PhaseMetadata<Id = string> {
	index: number;
	startTime: number;
	name: string;
}

export interface LeaguePhase<Id = string> extends PhaseMetadata<Id> {
	sessions?: Session<Id>[];
	aggregateTotals?: Record<string, number>;
}

export interface PlayerInformation {
	_id: string;
	nickname: string;
	zone: PlayerZone;
}

export interface PlayerTourneyStandingInformation {
	player: PlayerInformation;
	hasMetRequirements?: boolean;
	highlightedGameIds: string[];
	rank: number;
	score: number;
	totalMatches: number;
}

export interface TourneyPhase<Id = string> extends PhaseMetadata<Id> {
	standings?: PlayerTourneyStandingInformation[];
}

export type Phase<Id = string> = LeaguePhase<Id> | TourneyPhase<Id>


export type Contest<Id = any> = Store.Contest<Id> & {
	phases: PhaseMetadata[];
}

export interface YakumanInformation {
	han: Han[];
	player: PlayerInformation;
	game: {
		majsoulId: string;
		endTime: number;
	}
}
