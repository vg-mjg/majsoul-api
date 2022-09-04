import type { Han } from "majsoul";

import { PlayerInformation } from "./PlayerInformation";

export interface YakumanInformation {
	han: Han[];
	player: PlayerInformation;
	game: {
		majsoulId: string;
		endTime: number;
	}
}
