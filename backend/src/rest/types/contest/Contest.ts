import { ContestType } from "../../../store/enums.js";
import { Contest as StoreContest } from "../../../store/types/contest/Contest.js";
import { ContestTeam } from "../../../store/types/contest/ContestTeam.js";
import { PlayerInformation } from "../PlayerInformation.js";
import { PhaseMetadata } from "./PhaseMetadata.js";

export type Contest<Id = any> = Omit<Omit<StoreContest<Id>, "teams">, "type"> & {
	type?: ContestType;
	phases: PhaseMetadata[];
	teams?: (Omit<ContestTeam<Id>, "players"> & {
		players: PlayerInformation[];
	})[];
};
