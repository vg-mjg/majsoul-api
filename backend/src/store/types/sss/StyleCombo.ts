import { StyleComboType } from "../enums/StyleComboType";
import { StyleMeterChangeType } from "../enums/StyleMeterChangeType";

export interface StyleCombo {
	type: StyleMeterChangeType.Combo;
	comboType: StyleComboType;
	change: number;
	final: number;
}
