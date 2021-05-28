import { ObjectId } from 'mongodb';
import { Store } from '../..';
import { StatsVersion } from '../types/stats/StatsVersion';
import { GameResultVersion } from '../../store/types/types';

export function minimumVersion(game: Store.GameResult<ObjectId>): StatsVersion {
	if (game.version == null) {
		return StatsVersion.None;
	}

	switch (game.version) {
		case GameResultVersion.None:
			return StatsVersion.None;
		case GameResultVersion.First:
			return StatsVersion.First;
		default:
			return StatsVersion.None;
	}
}
