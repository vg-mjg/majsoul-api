import { Han } from "majsoul";

import { GameResult } from "./types/game/GameResult";
import { AgariInfo } from "./types/game/round/AgariInfo";
import { RoundInfo } from "./types/game/round/RoundInfo";

export function isAgariYakuman(
	{ config }: GameResult,
	{ dealership }: RoundInfo,
	agari: AgariInfo,
): boolean {
	if (!agari) {
		return false;
	}

	let { value } = agari;
	if (agari.han.findIndex(han => han === Han.Riichi || han === Han.Double_Riichi || agari.riichi) >= 0) {
		value += config?.riichiStickValue ?? 1000;
	}

	if (agari.winner === dealership) {
		return value >= 48000;
	}

	return value >= 32000;
}
