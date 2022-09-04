import { PlayerRankingType } from "../enums/PlayerRankingType";
import { GachaData } from "../GachaData";

export interface PlayerScoreTypeRanking {
	type: PlayerRankingType.Score;
	details: Record<string, {
		rank: number;
		score: number;
		highlightedGameIds?: string[];
		gachaData?: GachaData[];
	}>;
}
