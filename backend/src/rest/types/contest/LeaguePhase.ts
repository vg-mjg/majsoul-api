import { PhaseMetadata } from "./PhaseMetadata";
import { Session } from "./Session";

export interface LeaguePhase<Id = string> extends PhaseMetadata<Id> {
	sessions?: Session<Id>[];
	aggregateTotals?: Record<string, number>;
}
