import { DrawRecord } from "./DrawRecord.js";
import { PlayerStats } from "./PlayerStats.js";
import { RonRecord } from "./RonRecord.js";
import { RoundInfo } from "./RoundInfo.js";
import { TsumoRecord } from "./TsumoRecord.js";

export interface RoundResult {
	round: RoundInfo;
	draw?: DrawRecord;
	tsumo?: TsumoRecord;
	rons?: RonRecord[];
	playerStats: PlayerStats[];
}
