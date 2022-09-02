import { GameResultVersion } from "../enums/GameResultVersion.js";
import { Player } from "../Player.js";
import { FinalScore } from "./FinalScore.js";
import { RoundResult } from "./round/RoundResult.js";

export interface GameResult<Id = any> {
	config?: {
		aiLevel: number;
		riichiStickValue?: number;
	};
	contestMajsoulId?: number;
	majsoulId?: string;
	start_time?: number;
	end_time?: number;
	finalScore?: FinalScore[];
	rounds?: RoundResult[];
	_id?: Id;
	contestId: Id;
	players?: Player<Id>[];
	notFoundOnMajsoul?: boolean;
	hidden?: boolean;
	version?: GameResultVersion;
}
