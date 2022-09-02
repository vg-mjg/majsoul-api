import { AgariCategories } from "./AgariCategories.js";
import { AgariStats } from "./AgariStats.js";

export interface SelfAgariStats extends AgariCategories<AgariStats> {
	tsumo: number;
}
