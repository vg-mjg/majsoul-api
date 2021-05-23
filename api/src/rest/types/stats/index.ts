export interface RiichiStats {
	total:       number;
	daburiichi:  number;
	furiten:     number;
	sticks_kept: number; //own riichi sticks kept
	sticks_won:  number; //own included
	first:       number;
	chase:       number; //player chases
	chased:      number; //player is chased
	ippatsu:     number;
	ura_hit: number;
	immediate_dealin: number;
}

export interface DealerStats {
	rounds:           number;
	tsumo_hit:        number; //someone else tsumos
	tsumo_hit_points: number;
	tsumo_hit_mangan: number; //'' with mangan or above
	tsumo_hit_mangan_points: number;
	repeats:           number;
	max_repeats:       number;
}

export interface CallStats {
	opened_hands: number; //hands opened
	total:        number; //chinponyas
	opps:         number; //opportunities
	opps_all:     number; //'' including subsequent shouminkan/ankan chances
}

export interface AgariStatsBreakdown {
	points:    number;
	total:     number;
	ron?:      number;
	tsumo?:    number;
}

export interface AgariStats {
	yakuman: number; //double yakuman counts as 1
	total:   number;
	points:  number;
	open:    AgariStatsBreakdown; //state of the winning hand; not the player's; in the scope of deal-ins
	riichi:  AgariStatsBreakdown;
	dama:    AgariStatsBreakdown;
	uradora: number;
	akadora: number;
	dora:    number;
}

export interface DrawStats {
	total:   number; //number of exhaustive draws in the game
	points:  number;
	ten:     number; //tenpai at draw
	open:    number; //open hand at draw
	riichi:  number;
	nagashi: number;
}

export interface TurnStats {
	total:  number; //turns in the game; as counted by mjs
	riichi: number; //sum of turn counts in riichi rounds
	win:    number;
	dealin: number;
}

export interface PlayerGameStats {
	gamesPlayed: number;
	handsPlayed: number;
	averageShanten: number;

	riichi:  RiichiStats;
	dealer:  DealerStats;
	calls:   CallStats;
	wins:    AgariStats;
	dealins: AgariStats;
	dealins_while_open:   AgariStats;
	dealins_while_riichi: AgariStats;
	draws:   DrawStats;
	turns:   TurnStats;
}

export function createAgariStats(): AgariStats {
	return {
		yakuman: 0,
		total: 0,
		points: 0,
		open: {
			points: 0,
			total: 0,
			ron: 0,
			tsumo: 0,
		},
		riichi: {
			points: 0,
			total: 0,
			ron: 0,
			tsumo: 0,
		},
		dama: {
			points: 0,
			total: 0,
			ron: 0,
			tsumo: 0,
		},
		uradora: 0,
		akadora: 0,
		dora: 0,
	}
}

export function createStats(): PlayerGameStats {
	return {
		nhands: 0,
		shanten: 0,

		riichi: {
			total: 0,
			daburiichi: 0,
			furiten: 0,
			sticks_kept: 0,
			sticks_won: 0,
			first: 0,
			chase: 0,
			chased: 0,
			ippatsu: 0,
			ura_hit: 0,
			immediate_dealin: 0,
		},

		dealer: {
			rounds: 0,
			tsumo_hit: 0,
			tsumo_hit_points: 0,
			tsumo_hit_mangan: 0,
			tsumo_hit_mangan_points: 0,
			repeats: 0,
			max_repeats: 0,
		},

		calls: {
			opened_hands: 0,
			total: 0,
			opps: 0,
			opps_all: 0,
		},

		wins: createAgariStats(),
		dealins: createAgariStats(),
		dealins_while_open: createAgariStats(),
		dealins_while_riichi: createAgariStats(),
		draws: {
			total: 0,
			points: 0,
			ten: 0,
			open: 0,
			riichi: 0,
			nagashi: 0,
		},
		turns: {
			total: 0,
			riichi: 0,
			win: 0,
			dealin: 0,
		},
	}
}
