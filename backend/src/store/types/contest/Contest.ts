import { Contest as MajsoulContest } from "majsoul";

import { GachaGroup } from "../gacha/GachaGroup";
import { ContestPhase } from "./ContestPhase";
import { ContestPhaseTransition } from "./ContestPhaseTransition";

export interface Contest<Id = any> extends Partial<MajsoulContest>, Omit<Omit<Omit<ContestPhase<Id>, "name">, "startTime">, "index"> {
	_id?: Id;
	track?: boolean;
	adminPlayerFetchRequested?: boolean;

	refresh?: boolean;
	lastRefreshed?: number;

	displayName?: string;
	notFoundOnMajsoul?: boolean;
	initialPhaseName?: string;
	showPlayerCountries?: boolean;
	spreadsheetId?: string;
	transitions?: ContestPhaseTransition<Id>[];
	splitTies?: boolean;

	nicknameOverrides?: {
		_id: string;
		nickname: string;
	}[];

	gacha?: {
		groups: GachaGroup<Id>[];
	};
}
