import { GameRecord, lq } from "majsoul";

export enum UnifiedGameLogEventType {
	Unknown,
	NewRound,
	TileDiscard,
	TileDrawn,
	CallMade,
	EndOfWall,
	WinDeclared
}

export enum BackendType {
	Majsoul,
}

export interface UnifiedGameLogEventUnknown {
	type: UnifiedGameLogEventType.Unknown;
	origin: BackendType;
	rawEvent: any;
}

export interface UnifiedGameLogEventNewRound {
	type: UnifiedGameLogEventType.NewRound;
}

export interface UnifiedGameLogEventTileDiscard {
	type: UnifiedGameLogEventType.TileDiscard;
}

export interface UnifiedGameLogEventTileDrawn {
	type: UnifiedGameLogEventType.TileDrawn;
}

export interface UnifiedGameLogEventCallMade {
	type: UnifiedGameLogEventType.CallMade;
}

export interface UnifiedGameLogEventEndOfWall {
	type: UnifiedGameLogEventType.EndOfWall;
}

export interface UnifiedGameLogEventWinDeclared {
	type: UnifiedGameLogEventType.WinDeclared;
}

export type UnifiedGameLogEvent
	= UnifiedGameLogEventUnknown
	| UnifiedGameLogEventNewRound
	| UnifiedGameLogEventTileDiscard
	| UnifiedGameLogEventTileDrawn
	| UnifiedGameLogEventCallMade
	| UnifiedGameLogEventEndOfWall
	| UnifiedGameLogEventWinDeclared;

export interface UnifiedGameRecord {
	gameLog: UnifiedGameLogEvent[];
}

export function unifyMajsoulGameRecord(majsoulGame: GameRecord): UnifiedGameRecord {
	const gameLog: UnifiedGameLogEvent[] = majsoulGame.records.map(record => {
		switch(record.constructor.name) {
		case "RecordNewRound": {
			const recordNewRound = record as lq.RecordNewRound;
			return {
				type: UnifiedGameLogEventType.NewRound,
			};
		} case "RecordDiscardTile": {
			const recordDiscardTile = record as lq.RecordDiscardTile;
			return {
				type: UnifiedGameLogEventType.TileDiscard,
			};
		} case "RecordDealTile": {
			const recordDealTile = record as lq.RecordDealTile;
			return {
				type: UnifiedGameLogEventType.TileDrawn,
			};
		} case "RecordAnGangAddGang": {
			const recordAnGangAddGang = record as lq.RecordAnGangAddGang;
			return {
				type: UnifiedGameLogEventType.CallMade,
			};
		} case "RecordChiPengGang": {
			const recordChiPengGang = record as lq.RecordChiPengGang;
			return {
				type: UnifiedGameLogEventType.CallMade,
			};
		} case "RecordNoTile": {
			const recordNoTile = record as lq.RecordNoTile;
			return {
				type: UnifiedGameLogEventType.EndOfWall,
			};
		} case "RecordHule": {
			const recordHule = record as lq.RecordHule;
			return {
				type: UnifiedGameLogEventType.WinDeclared,
			};
		} default: {
			console.log(record.constructor.name);
			return {
				type: UnifiedGameLogEventType.Unknown,
				origin: BackendType.Majsoul,
				rawEvent: {
					...record,
					type: record.constructor.name,
				},
			};
		}
		}
	});
	return {gameLog};
}
