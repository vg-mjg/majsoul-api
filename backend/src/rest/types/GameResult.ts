import { GameResult as StoreGameResult } from "../../store/types/game/GameResult.js";

export interface GameResult<Id = any> extends StoreGameResult<Id> {
	sessionId?: Id;
}
