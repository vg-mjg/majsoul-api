import { GameMetadata } from "../store/GameMetadata";
import { UnifiedGameRecord } from "../store/UnifiedGameRecord";

export enum StyleMoveType {
	Unknown,
}

export interface StyleMove {
	type: StyleMoveType;
	points: number;
}

export interface StyleBreakdown {
	total: number;
	moves: StyleMove[];
}

export function calculateStyle(gameRecord: UnifiedGameRecord, gameMetadata: GameMetadata): StyleBreakdown[] {
	return [];
}
