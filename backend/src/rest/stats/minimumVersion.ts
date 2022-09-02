import { ObjectId } from "mongodb";

import { GameResultVersion } from "../../store/types/enums/GameResultVersion.js";
import { GameResult as StoreGameResult } from "../../store/types/game/GameResult.js";
import { StatsVersion } from "../types/enums/StatsVersion.js";

export function minimumVersion(game: StoreGameResult<ObjectId>): StatsVersion {
	if (game.version == null) {
		return StatsVersion.None;
	}

	switch (game.version) {
	case GameResultVersion.None:
		return StatsVersion.None;
	case GameResultVersion.First:
	case GameResultVersion.Second:
		return StatsVersion.First;
	case GameResultVersion.Third:
	case GameResultVersion.Fourth:
		return StatsVersion.Khan;
	default:
		return StatsVersion.None;
	}
}
