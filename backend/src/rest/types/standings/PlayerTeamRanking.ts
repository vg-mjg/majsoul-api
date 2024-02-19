import { PlayerRankingType } from "../enums/PlayerRankingType";
import { PlayerScoreTypeRanking } from "./PlayerScoreTypeRanking";
import { SharedGroupRankingData } from "./SharedGroupRankingData";

export interface PlayerTeamRanking {
	type: PlayerRankingType.Team;
	details: Record<string, SharedGroupRankingData & {
		scoreRanking: PlayerScoreTypeRanking;
	}>;
}
