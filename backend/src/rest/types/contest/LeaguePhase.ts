import { PhaseMetadata } from "./PhaseMetadata.js";
import { Session } from "./Session.js";

export interface LeaguePhase<Id = string> extends PhaseMetadata<Id> {
	sessions?: Session<Id>[];
	aggregateTotals?: Record<string, number>;
}
