import { GameRecord, Han, lq } from "majsoul";
import syanten from "syanten";
import * as util from "util";

import { Wind } from "../store/types/enums/Wind";
import { handToSyantenFormat } from "./handToSyantenFormat";

export enum UnifiedGameLogEventType {
	Unknown,
	NewRound,
	TileDiscard,
	Abortion,
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
	dealer: Wind;
}

export interface UnifiedGameLogEventTileDiscard {
	type: UnifiedGameLogEventType.TileDiscard;
	player: Wind;
	riichi?: boolean;
	isDoubleRiichi?: boolean;
	furiten: Record<Wind, boolean>;
}

export interface UnifiedGameLogEventTileDrawn {
	type: UnifiedGameLogEventType.TileDrawn;
}

export enum CallType {
	Chii,
	Pon,
	Daiminkan,
	Ankan,
	Shouminkan
}

export interface UnifiedGameLogEventCallMade {
	type: UnifiedGameLogEventType.CallMade;
	player: Wind;
	callType: CallType;
}

export enum AbortionType {
	KyuushuuKyuuhai = 1,
	FourWinds = 2,
	FourKans = 3,
	FourRiichi = 4,
}

export interface UnifiedGameLogEventAbortion {
	type: UnifiedGameLogEventType.Abortion;
	abortionType: AbortionType;
	player: Wind;
}

export interface UnifiedGameLogEventEndOfWall {
	type: UnifiedGameLogEventType.EndOfWall;
}

export interface HanDetail {
	value: number;
	han: Han;
}

export interface UnifiedWinData {
	winner: Wind;
	loser?: Wind;
	combinedBaseHandValue: number;
	han: HanDetail[];
	hand: string[];
	dora: string[];
}

export interface UnifiedGameLogEventWinDeclared {
	type: UnifiedGameLogEventType.WinDeclared;
	wins: UnifiedWinData[];
}

export type UnifiedGameLogEvent
	= UnifiedGameLogEventUnknown
	| UnifiedGameLogEventNewRound
	| UnifiedGameLogEventTileDiscard
	| UnifiedGameLogEventTileDrawn
	| UnifiedGameLogEventCallMade
	| UnifiedGameLogEventEndOfWall
	| UnifiedGameLogEventAbortion
	| UnifiedGameLogEventWinDeclared;

export interface UnifiedPlayer {
	// platformData: UnifiedPlayerData;
	id: string;
	seat: Wind
	// finalScore: {
	// 	uma: number;
	// 	points: number;
	// }
}


export interface UnifiedGameRecord {
	// id: string;
	// settings: any;
	// startTime: number;
	// endTime: number;
	players: UnifiedPlayer[];
	gameLog: UnifiedGameLogEvent[];
}


function anGangAddGangToCallType(type: number): CallType {
	if (type === 2)  {
		return CallType.Shouminkan;
	}
	return CallType.Ankan;
}

function chiPengGangToCallType(type: number): CallType {
	if (type === 2)  {
		return CallType.Daiminkan;
	}

	if (type === 1)  {
		return CallType.Pon;
	}

	return CallType.Chii;
}

export function unifyMajsoulGameRecord(majsoulGame: GameRecord): UnifiedGameRecord {
	let losingSeat: Wind = null;
	let activePlayer: Wind = null;
	const gameLog: UnifiedGameLogEvent[] = majsoulGame.records.map(record => {
		switch(record.constructor.name) {
		case "RecordNewRound": {
			const recordNewRound = record as lq.RecordNewRound;
			losingSeat = null;
			return {
				type: UnifiedGameLogEventType.NewRound,
				dealer: recordNewRound.ju,
			};
		} case "RecordDiscardTile": {
			const recordDiscardTile = record as lq.RecordDiscardTile;
			losingSeat = recordDiscardTile.seat;
			return {
				type: UnifiedGameLogEventType.TileDiscard,
				player: recordDiscardTile.seat,
				riichi: recordDiscardTile.is_liqi,
				isDoubleRiichi: recordDiscardTile.is_wliqi,
				furiten: recordDiscardTile.zhenting as any as Record<Wind, boolean>,
			};
		} case "RecordDealTile": {
			const recordDealTile = record as lq.RecordDealTile;
			activePlayer = recordDealTile.seat;
			return {
				type: UnifiedGameLogEventType.TileDrawn,
			};
		} case "RecordAnGangAddGang": {
			const recordAnGangAddGang = record as lq.RecordAnGangAddGang;
			losingSeat = recordAnGangAddGang.seat;
			return {
				type: UnifiedGameLogEventType.CallMade,
				player: recordAnGangAddGang.seat,
				callType: anGangAddGangToCallType(recordAnGangAddGang.type),
			};
		} case "RecordChiPengGang": {
			const recordChiPengGang = record as lq.RecordChiPengGang;
			return {
				type: UnifiedGameLogEventType.CallMade,
				player: recordChiPengGang.seat,
				callType: chiPengGangToCallType(recordChiPengGang.type),
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
				wins: recordHule.hules.map(hule => ({
					hand: hule.hand,
					dora: hule.doras,
					winner: hule.seat as Wind,
					loser: (hule.zimo ? null : losingSeat) as Wind,
					han: hule.fans?.map(fan => ({
						han: fan.id as Han,
						value: fan.val,
					})),
					combinedBaseHandValue: hule.zimo ? hule.point_zimo_qin + hule.point_zimo_xian * 2 : hule.point_rong,
				})),
			} as UnifiedGameLogEventWinDeclared;
		} case "RecordLiuJu": {
			const recordLiuJu = record as lq.RecordLiuJu;
			return {
				type: UnifiedGameLogEventType.Abortion,
				abortionType: recordLiuJu.type as AbortionType,
				player: activePlayer,
			};
		} default: {
			console.log(`"${record.constructor.name}" unnacounted for`);
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
	return {
		players: majsoulGame.head.result.players.map(playerItem => {
			const account = majsoulGame.head.accounts.find(a => a.seat === playerItem.seat);
			return {
				id: account ? account.account_id.toString() : null,
				seat: playerItem.seat as Wind,
			};
		}),
		gameLog,
	};
}
