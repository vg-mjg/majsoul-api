import { PlayerRankingType } from "../enums/PlayerRankingType.js";
import { GachaData } from "../GachaData.js";

export interface PlayerScoreTypeRanking {
	type: PlayerRankingType.Score;
	details: Record<string, {
		rank: number;
		score: number;
		highlightedGameIds?: string[];
		gachaData?: GachaData[];
	}>;
}
