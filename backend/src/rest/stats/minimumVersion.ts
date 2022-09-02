import { ObjectId } from "mongodb";
import { Store } from "../../index.js";
import { StatsVersion } from "../types/stats/StatsVersion.js";
import { GameResultVersion } from "../../store/types/types.js";

export function minimumVersion(game: Store.GameResult<ObjectId>): StatsVersion {
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
