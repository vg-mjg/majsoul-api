import { ContestType } from "../enums/ContestType";
import { ContestTeam } from "./ContestTeam";
import { LeagueContestGroup } from "./LeagueContestGroup";

export interface LeagueContestPhase<Id = any> {
	type?: ContestType.League;
	teams?: ContestTeam<Id>[];
	groups?: LeagueContestGroup[];
}
