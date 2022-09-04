import { ContestType } from "../../../store/enums";
import { Contest as StoreContest } from "../../../store/types/contest/Contest";
import { ContestTeam } from "../../../store/types/contest/ContestTeam";
import { PlayerInformation } from "../PlayerInformation";
import { PhaseMetadata } from "./PhaseMetadata";

export type Contest<Id = any> = Omit<Omit<StoreContest<Id>, "teams">, "type"> & {
	type?: ContestType;
	phases: PhaseMetadata[];
	teams?: (Omit<ContestTeam<Id>, "players"> & {
		players: PlayerInformation[];
	})[];
};
