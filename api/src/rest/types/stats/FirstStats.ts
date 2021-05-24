import { StatsVersion } from "./StatsVersion";

export interface RiichiStats {
	total: number;
	double: number;
	furiten: number;
	first: number;
	chase: number; //player chases
	chased: number; //player is chased
	ippatsu: number;
	uraHit: number;
	immediateDealins: number;
}

export interface DealerStats {
	tsumoHit: number; //someone else tsumos
	tsumoHitAveragePoints: number;
	tsumoHitMangan: number; //'' with mangan or above
}

export interface CallStats {
	openedHands: number; //hands opened
	totalCalls: number; //chinponyas
	opportunities: number; //opportunities
	allOpportunities: number; //'' including subsequent shouminkan/ankan chances
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
		averageHaipaiShanten: number;
		averageRank: number;
		averageHandLength: number;

		uraDora: number;
		akaDora: number;

		riichi: RiichiStats;
		dealer: DealerStats;
		calls: CallStats;
		wins: AgariStats;
		dealins: {
			open: AgariStats;
			riichi: AgariStats;
			dama: AgariStats;
		}
		draws: DrawStats;
	}
}
