import { KanStatics } from "./KanStatics.js";

export interface CallStats {
	total: number; //chinponyas
	kans: KanStatics;
	opportunities: number; //opportunities
	repeatOpportunities: number; //'' including subsequent shouminkan/ankan chances
}
