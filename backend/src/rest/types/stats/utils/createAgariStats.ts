import { AgariCategories } from "../first/AgariCategories";
import { AgariStats } from "../first/AgariStats";

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
		},
	};
}
