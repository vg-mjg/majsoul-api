import type { Han } from "majsoul";

import { PlayerInformation } from "./PlayerInformation.js";

export interface YakumanInformation {
	han: Han[];
	player: PlayerInformation;
	game: {
		majsoulId: string;
		endTime: number;
	}
}
