import { ContestPhaseShared } from "./ContestPhaseShared.js";
import { LeagueContestPhase } from "./LeagueContestPhase.js";
import { TourneyContestPhase } from "./TourneyContestPhase.js";

//TODO: shouldn't be & join.
export type ContestPhase<Id = any> = ContestPhaseShared & (LeagueContestPhase<Id> & TourneyContestPhase);
