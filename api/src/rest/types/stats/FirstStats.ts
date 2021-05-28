import { StatsVersion } from "./StatsVersion";

export interface RiichiStats {
	total: number;
	furiten: number;
	first: number;
	chase: number; //player chases
	chased: number; //player is chased
	ippatsu: number;
	uraHit: number;
}

export interface DealerStats {
	tsumoHit: number; //someone else tsumos
	tsumoHitAveragePoints: number;
	tsumoHitMangan: number; //'' with mangan or above
}

export interface CallStats {
	openedHands: number; //hands opened
	total: number; //chinponyas
	opportunities: number; //opportunities
	repeatOpportunities: number; //'' including subsequent shouminkan/ankan chances
}

export interface AgariStatsBase {
	total: number;
	points: number;
}

export interface AgariStats extends AgariStatsBase {
	open: AgariStatsBase; //state of the winning hand; not the player's; in the scope of deal-ins
	riichi: AgariStatsBase;
	dama: AgariStatsBase;
}

export interface SelfAgariStats extends AgariStats {
	tsumo: number;
}

export interface DrawStats {
	total: number;
	tenpai: number; //tenpai at draw
	open: number; //open hand at draw
	riichi: number;
}

export interface FirstStats {
	version: StatsVersion.First;
	stats: {
		gamesPlayed: number;
		totalHands: number;
		totalHaipaiShanten: number;
		totalRank: number;

		uraDora: number;
		akaDora: number;

		riichi: RiichiStats;
		dealer: DealerStats;
		calls: CallStats;
		wins: SelfAgariStats;
		dealins: {
			open: AgariStats;
			riichi: AgariStats;
			dama: AgariStats;
		}
		draws: DrawStats;
	}
}

function createAgariStats(): AgariStats {
	return {
		total: 0,
		points: 0,
		dama: {
			points: 0,
			total: 0,
		},
		riichi: {
			points: 0,
			total: 0,
		},
		open: {
			points: 0,
			total: 0,
		}
	}
}

export function createStats(): FirstStats['stats'] {
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
			tsumoHitAveragePoints: 0,
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
	}
}
