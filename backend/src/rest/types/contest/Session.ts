import { Session as StoreSession } from "../../../store/types/contest/Session.js";

export interface Session<Id = any> extends StoreSession<Id> {
	totals: Record<string, number>;
	aggregateTotals: Record<string, number>;
}
