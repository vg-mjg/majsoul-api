import { DrawRecord } from "./DrawRecord";
import { PlayerStats } from "./PlayerStats";
import { RonRecord } from "./RonRecord";
import { RoundInfo } from "./RoundInfo";
import { TsumoRecord } from "./TsumoRecord";

export interface RoundResult {
	round: RoundInfo;
	draw?: DrawRecord;
	tsumo?: TsumoRecord;
	rons?: RonRecord[];
	playerStats: PlayerStats[];
}
