import { PlayerInformation } from "../PlayerInformation.js";
import { PlayerScoreTypeRanking } from "./PlayerScoreTypeRanking.js";
import { PlayerTeamRanking } from "./PlayerTeamRanking.js";
import { SharedGroupRankingData } from "./SharedGroupRankingData.js";


export type PlayerTourneyStandingInformation = SharedGroupRankingData & {
	player: PlayerInformation;
	hasMetRequirements?: boolean;
	totalMatches: number;
	rankingDetails: PlayerScoreTypeRanking | PlayerTeamRanking;
};
