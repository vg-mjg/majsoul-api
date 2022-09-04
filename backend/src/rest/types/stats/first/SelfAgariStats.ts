import { AgariCategories } from "./AgariCategories";
import { AgariStats } from "./AgariStats";

export interface SelfAgariStats extends AgariCategories<AgariStats> {
	tsumo: number;
}
