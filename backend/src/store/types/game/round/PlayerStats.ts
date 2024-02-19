import { CallStats } from "./CallStats";
import { HandState } from "./HandState";

export interface PlayerStats {
	haipaiShanten: number;
	calls: CallStats;
	finalHandState: HandState;
}
