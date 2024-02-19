import { FinalScore } from "./FinalScore";

export interface GameCorrection<Id = any> {
	_id?: Id;
	gameId: Id;
	finalScore?: FinalScore[];
}
