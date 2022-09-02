import { FinalScore } from "./FinalScore.js";

export interface GameCorrection<Id = any> {
	_id?: Id;
	gameId: Id;
	finalScore?: FinalScore[];
}
