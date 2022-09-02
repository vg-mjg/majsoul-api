import type { lq } from "./liqi.js";

export type GameStepRecord = lq.RecordNewRound
	| lq.RecordDiscardTile
	| lq.RecordDealTile
	| lq.RecordAnGangAddGang
	| lq.RecordChiPengGang
	| lq.RecordLiuJu
	| lq.RecordNoTile
	| lq.RecordHule;

export interface GameRecord extends lq.IResGameRecord {
	records: GameStepRecord[];
}
