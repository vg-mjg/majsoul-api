import { AgariCategories } from "../first/AgariCategories.js";
import { AgariStats } from "../first/AgariStats.js";

export function createAgariStats(): AgariCategories<AgariStats> {
	return {
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
	};
}
