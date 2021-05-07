class RiichiStats {
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
    constructor() {
    	this.total       = 0;
    	this.daburiichi  = 0;
    	this.furiten     = 0;
    	this.sticks_kept = 0;
    	this.sticks_won  = 0;
    	this.first       = 0;
    	this.chase       = 0;
    	this.chased      = 0;
    	this.ippatsu     = 0;
        this.ura_hit     = 0;
    	this.immediate_dealin = 0;
    }
}

class DealerStats {
    rounds:           number;
    tsumo_hit:        number; //someone else tsumos
    tsumo_hit_points: number;
    tsumo_hit_mangan: number; //'' with mangan or above
    tsumo_hit_mangan_points: number;
    repeats:           number;
    max_repeats:       number;
	constructor() {
    	this.rounds           = 0;
    	this.tsumo_hit        = 0;
    	this.tsumo_hit_points = 0;
    	this.tsumo_hit_mangan = 0;
    	this.tsumo_hit_mangan_points = 0;
    	this.repeats          = 0;
    	this.max_repeats      = 0;
    }
}

class CallStats {
    opened_hands: number; //hands opened
    total:        number; //chinponyas
    opps:         number; //opportunities
    opps_all:     number; //'' including subsequent shouminkan/ankan chances
	constructor() {
    	this.opened_hands = 0;
    	this.total        = 0;
    	this.opps         = 0;
    	this.opps_all     = 0;
    }
}

class AgariStatsBreakdown {
    points:    number;
    total:     number;
    ron?:      number;
    tsumo?:    number;
    constructor() {
    	this.points    = 0;
    	this.total     = 0;
    	this.ron       = 0;
    	this.tsumo     = 0;
    }
}

class AgariStats {
    yakuman: number; //double yakuman counts as 1
    total:   number;
    points:  number;
    open:    AgariStatsBreakdown; //state of the winning hand; not the player's; in the scope of deal-ins
    riichi:  AgariStatsBreakdown;
    dama:    AgariStatsBreakdown;
    uradora: number;
    akadora: number;
    dora:    number;
    constructor() {
        this.total    = 0;
        this.points   = 0;
        this.yakuman  = 0;
        this.open     = new AgariStatsBreakdown; //state of the winning hand; not the player's; in the scope of deal-ins
        this.riichi   = new AgariStatsBreakdown;
        this.dama     = new AgariStatsBreakdown;
    	this.uradora  = 0;
    	this.akadora  = 0;
    	this.dora     = 0;
    }
}

class DrawStats {
    total:   number; //number of exhaustive draws in the game
    points:  number;
    ten:     number; //tenpai at draw
    open:    number; //open hand at draw
    riichi:  number;
    nagashi: number;
    constructor() {
        this.total = 0; //number of exhaustive draws in the game
        this.points = 0;
        this.ten = 0; //tenpai at draw
        this.open = 0; //open hand at draw
        this.riichi = 0;
        this.nagashi = 0;
    }
}

class TurnStats {
    total:  number; //turns in the game; as counted by mjs
    riichi: number; //sum of turn counts in riichi rounds
    win:    number;
    dealin: number;
    constructor() {
        this.total = 0; //turns in the game; as counted by mjs
        this.riichi = 0; //sum of turn counts in riichi rounds
        this.win = 0;
        this.dealin = 0;
    }
}

export class PlayerGameStats {
    nhands:  number;          //total hands played in game
    shanten: number;
    riichi:  RiichiStats;
    dealer:  DealerStats;
    calls:   CallStats;
    wins:    AgariStats;
    dealins: AgariStats;
    dealins_while_open:   AgariStats;
    dealins_while_riichi: AgariStats;
    draws:   DrawStats;
    turns:   TurnStats;
    constructor() {
	    this.nhands  = 0;
        this.shanten = 0;
        this.riichi  = new RiichiStats;
        this.dealer  = new DealerStats;
        this.calls   = new CallStats;
        this.wins    = new AgariStats;
        this.dealins = new AgariStats;
        this.dealins_while_open   = new AgariStats;
        this.dealins_while_riichi = new AgariStats;
        this.draws = new DrawStats;
        this.turns = new TurnStats;
	}
}
