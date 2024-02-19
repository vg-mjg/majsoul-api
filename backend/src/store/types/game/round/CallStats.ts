import { KanStatics } from "./KanStatics";

export interface CallStats {
	total: number; //chinponyas
	kans: KanStatics;
	opportunities: number; //opportunities
	repeatOpportunities: number; //'' including subsequent shouminkan/ankan chances
}
