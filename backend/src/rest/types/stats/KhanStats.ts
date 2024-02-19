import { KanStatics } from "../../../store/types/game/round/KanStatics";
import { StatsVersion } from "../enums/StatsVersion";
import { FirstStats } from "./FirstStats";

export interface KhanStats {
	version: StatsVersion.Khan;
	stats: Omit<FirstStats["stats"], "calls"> & {
		calls: FirstStats["stats"]["calls"] & {
			kans: KanStatics;
		}
	}
}
