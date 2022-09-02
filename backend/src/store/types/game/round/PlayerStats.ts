import { CallStats } from "./CallStats.js";
import { HandState } from "./HandState.js";

export interface PlayerStats {
	haipaiShanten: number;
	calls: CallStats;
	finalHandState: HandState;
}
