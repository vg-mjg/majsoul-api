import { LeaguePhase } from "./LeaguePhase.js";
import { TourneyPhase } from "./TourneyPhase.js";

export type Phase<Id = string> = LeaguePhase<Id> | TourneyPhase<Id>;
