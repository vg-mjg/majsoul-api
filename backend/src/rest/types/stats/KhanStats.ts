import { KanStatics } from "../../../store/types/game/round/KanStatics.js";
import { StatsVersion } from "../enums/StatsVersion.js";
import { FirstStats } from "./FirstStats.js";

export interface KhanStats {
	version: StatsVersion.Khan;
	stats: Omit<FirstStats["stats"], "calls"> & {
		calls: FirstStats["stats"]["calls"] & {
			kans: KanStatics;
		}
	}
}
