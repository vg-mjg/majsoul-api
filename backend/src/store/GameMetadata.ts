import { Wind } from "./enums";
import { CallType, HanDetail, UnifiedGameLogEvent, UnifiedGameLogEventType, UnifiedGameRecord } from "./UnifiedGameRecord";

export interface GameMetadata {
	rounds: RoundMetadata[];
}

export enum RoundConclusionType {
	Ron,
	Tsumo,
	Ryuukyoku,
}

export interface RoundRonConclusion {
	type: RoundConclusionType.Ron;
	rons?: RonDetails[];
}

export interface AgariDetails {
	winner: Wind;
	han: HanDetail[];
	baseHandCombinedValue: number;
}

export interface RonDetails extends AgariDetails {
	loser: Wind;
	tsubamegaeshi?: boolean;
}

export interface RoundTsumoConclusion extends AgariDetails {
	type: RoundConclusionType.Tsumo;
}

export interface RoundRyuukyokuConclusion {
	type: RoundConclusionType.Ryuukyoku;
}

export type RoundConclusion = RoundRonConclusion | RoundTsumoConclusion | RoundRyuukyokuConclusion;

export enum FinalHandStateType {
	Open,
	Riichi,
	Closed,
}

export interface FinalHandState {
	state: FinalHandStateType;
	furiten?: boolean;
}

export interface RoundMetadata {
	events: UnifiedGameLogEvent[];
	conclusion: RoundConclusion;
	dealer: Wind;
	finalHandStates: Record<Wind, FinalHandState>;
}

export function buildGameMetadata(unifiedGameRecord: UnifiedGameRecord): GameMetadata {
	const gameMetadata: GameMetadata = {
		rounds: [],
	};

	const events = [...unifiedGameRecord.gameLog];

	let round: RoundMetadata = {
		events: [],
		conclusion: null,
		dealer: Wind.East,
		finalHandStates: {} as Record<Wind, FinalHandState>,
	};

	while (events.length) {
		const event = events.shift();
		round.events.push(event);
		switch(event.type) {
		case UnifiedGameLogEventType.NewRound: {
			round.dealer = event.dealer;
			for (const player of unifiedGameRecord.players) {
				round.finalHandStates[player.seat] = {
					state: FinalHandStateType.Closed,
				};
			}
			continue;
		}
		case UnifiedGameLogEventType.CallMade: {
			if (event.callType === CallType.Chii || event.callType === CallType.Pon || event.callType === CallType.Daiminkan) {
				round.finalHandStates[event.player].state = FinalHandStateType.Open;
			}
			continue;
		}
		case UnifiedGameLogEventType.TileDiscard: {
			if (event.riichi || event.isDoubleRiichi) {
				round.finalHandStates[event.player].state = FinalHandStateType.Riichi;
			}

			for (const player in round.finalHandStates) {
				const state = round.finalHandStates[player] as FinalHandState;
				state.furiten = event.furiten[player];
			}
			continue;
		}
		case UnifiedGameLogEventType.EndOfWall: {
			round.conclusion = {
				type: RoundConclusionType.Ryuukyoku,
			};
			break;
		}
		case UnifiedGameLogEventType.WinDeclared: {
			if (event.wins.length === 1 || event.wins[0]?.loser == null) {
				round.conclusion = {
					type: RoundConclusionType.Tsumo,
					han: event.wins[0].han,
					winner: event.wins[0].winner,
					baseHandCombinedValue: event.wins[0].combinedBaseHandValue,
				};
			} else {
				round.conclusion = {
					type: RoundConclusionType.Ron,
					rons: event.wins.map(win => ({
						han: win.han,
						winner: win.winner,
						baseHandCombinedValue: win.combinedBaseHandValue,
						loser: win.loser,
					})),
				};
			}
			break;
		} default: {
			continue;
		}
		}

		gameMetadata.rounds.push(round);
		round = {
			events: [],
			conclusion: null,
			dealer: Wind.East,
			finalHandStates: {} as Record<Wind, FinalHandState>,
		};
	}

	if (round.events.length) {
		gameMetadata.rounds.push(round);
	}

	return gameMetadata;
}
