import { KanStatics } from "../../../store/index.js";
import { createStats, FirstStats } from "./FirstStats.js";
import { StatsVersion } from "./StatsVersion.js";

export interface KhanStats {
	version: StatsVersion.Khan;
	stats: Omit<FirstStats['stats'], 'calls'> & {
		calls: FirstStats['stats']['calls'] & {
			kans: KanStatics;
		}
	}
}

export function createKhanStats(): KhanStats['stats'] {
	const stats = createStats() as KhanStats['stats'];
	stats.calls.kans = {
		ankan: 0,
		daiminkan: 0,
		rinshan: 0,
		shouminkan: 0,
		shouminkanRobbed: 0,
	}
	return stats;
}
