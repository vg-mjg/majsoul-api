import { GameResult as StoreGameResult } from "../../store/types/game/GameResult.js";
import { PlayerInformation } from "./PlayerInformation.js";

export interface EliminationMatchDetails {
	players: PlayerInformation[];
	games: StoreGameResult[];
}
