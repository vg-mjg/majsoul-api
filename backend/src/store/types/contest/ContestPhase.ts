import { ContestPhaseShared } from "./ContestPhaseShared";
import { LeagueContestPhase } from "./LeagueContestPhase";
import { TourneyContestPhase } from "./TourneyContestPhase";

//TODO: shouldn't be & join.
export type ContestPhase<Id = any> = ContestPhaseShared & (LeagueContestPhase<Id> & TourneyContestPhase);
