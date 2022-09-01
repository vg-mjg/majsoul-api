import { GameResult } from "../store/index.js";

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

export function calculateStyle(test: GameResult): StyleBreakdown[] {
	return [];
}
