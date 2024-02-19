import { LeaguePhase } from "./LeaguePhase";
import { TourneyPhase } from "./TourneyPhase";

export type Phase<Id = string> = LeaguePhase<Id> | TourneyPhase<Id>;
