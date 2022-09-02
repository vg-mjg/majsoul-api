import { KhanStats } from "../KhanStats.js";
import { createFirstStats } from "./createFirstStats.js";

export function createKhanStats(): KhanStats["stats"] {
	const stats = createFirstStats() as KhanStats["stats"];
	stats.calls.kans = {
		ankan: 0,
		daiminkan: 0,
		rinshan: 0,
		shouminkan: 0,
		shouminkanRobbed: 0,
	};
	return stats;
}
