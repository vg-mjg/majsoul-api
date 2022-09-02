import { PlayerRankingType } from "../enums/PlayerRankingType.js";
import { PlayerScoreTypeRanking } from "./PlayerScoreTypeRanking.js";
import { SharedGroupRankingData } from "./SharedGroupRankingData.js";

export interface PlayerTeamRanking {
	type: PlayerRankingType.Team;
	details: Record<string, SharedGroupRankingData & {
		scoreRanking: PlayerScoreTypeRanking;
	}>;
}
