import { ContestType } from "../enums/ContestType.js";
import { ContestTeam } from "./ContestTeam.js";

export interface LeagueContestPhase<Id = any> {
	type?: ContestType.League;
	teams?: ContestTeam<Id>[];
}
