import { ContestType } from "../enums/ContestType";
import { ContestTeam } from "./ContestTeam";

export interface LeagueContestPhase<Id = any> {
	type?: ContestType.League;
	teams?: ContestTeam<Id>[];
}
