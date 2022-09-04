import { PlayerInformation } from "../PlayerInformation";
import { PlayerScoreTypeRanking } from "./PlayerScoreTypeRanking";
import { PlayerTeamRanking } from "./PlayerTeamRanking";
import { SharedGroupRankingData } from "./SharedGroupRankingData";


export type PlayerTourneyStandingInformation = SharedGroupRankingData & {
	player: PlayerInformation;
	hasMetRequirements?: boolean;
	totalMatches: number;
	rankingDetails: PlayerScoreTypeRanking | PlayerTeamRanking;
};
