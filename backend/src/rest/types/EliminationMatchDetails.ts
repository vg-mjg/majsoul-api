import { GameResult as StoreGameResult } from "../../store/types/game/GameResult";
import { PlayerInformation } from "./PlayerInformation";

export interface EliminationMatchDetails {
	players: PlayerInformation[];
	games: StoreGameResult[];
}
