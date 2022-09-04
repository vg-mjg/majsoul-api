import { Player } from "../../store/types/Player";

export interface ContestPlayer<Id = any> extends Player<Id> {
	tourneyScore: number;
	tourneyRank: number;
	gamesPlayed: number;
	team: {
		teams: Array<string>;
		seeded: boolean;
	};
}
