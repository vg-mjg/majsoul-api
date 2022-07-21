import { ObjectID } from "mongodb";
import { Contest, ContestPhase, ContestPhaseTransition, PhaseInfo } from "./types";

export function buildContestPhases(contest: Contest<ObjectID>): PhaseInfo<ObjectID> {
		if (contest == null) {
			return null;
		}

		const phases: ContestPhase<ObjectID>[] = [{
			...contest,
			name: contest.initialPhaseName ?? "予選",
			index: 0,
			startTime: 0,
		}];

		const transitions = [
			{
				name: phases[0].name,
				startTime: 0,
				scoringTypes: phases[0].tourneyType
			} as ContestPhaseTransition<ObjectID>,
			...(contest.transitions ?? [])
		].sort((a, b) => a.startTime - b.startTime);

		for(const transition of transitions.slice(1)) {
			const nextPhase = {
				...phases[phases.length - 1],
				index: phases.length,
				startTime: transition.startTime,
			};

			if (transition.name) {
				nextPhase.name = transition.name;
			}

			if (transition.scoringTypes) {
				nextPhase.tourneyType = transition.scoringTypes;
			}

			if (transition.eliminationBracketSettings) {
				nextPhase.eliminationBracketSettings = transition.eliminationBracketSettings;
			}

			if (transition.eliminationBracketTargetPlayers) {
				nextPhase.eliminationBracketTargetPlayers = transition.eliminationBracketTargetPlayers;
			}

			phases.push(nextPhase);
		}

		return {
			contest,
			transitions,
			phases
		};
	}
