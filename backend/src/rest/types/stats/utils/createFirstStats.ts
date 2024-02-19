import { FirstStats } from "../FirstStats";
import { createAgariStats } from "./createAgariStats";

export function createFirstStats(): FirstStats["stats"] {
	return {
		gamesPlayed: 0,
		totalHands: 0,
		totalRank: 0,
		totalHaipaiShanten: 0,
		uraDora: 0,
		akaDora: 0,
		riichi: {
			total: 0,
			uraHit: 0,
			first: 0,
			chase: 0,
			chased: 0,
			furiten: 0,
			ippatsu: 0,
		},
		dealer: {
			tsumoHit: 0,
			tsumoHitPoints: 0,
			tsumoHitMangan: 0,
		},
		calls: {
			openedHands: 0,
			total: 0,
			opportunities: 0,
			repeatOpportunities: 0,
		},
		wins: {
			...createAgariStats(),
			tsumo: 0,
		},
		dealins: {
			open: createAgariStats(),
			riichi: createAgariStats(),
			dama: createAgariStats(),
		},
		draws: {
			total: 0,
			tenpai: 0,
			open: 0,
			riichi: 0,
		},
	};
}
