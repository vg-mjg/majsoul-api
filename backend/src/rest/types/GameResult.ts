import { GameResult as StoreGameResult } from "../../store/types/game/GameResult";
import { StyleBreakdown } from "../../store/types/sss/StyleBreakdown";

export interface GameResult<Id = any> extends StoreGameResult<Id> {
	sessionId?: Id;
	styles: StyleBreakdown[];
}
