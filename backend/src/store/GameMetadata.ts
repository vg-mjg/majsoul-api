import { UnifiedGameLogEvent, UnifiedGameLogEventType, UnifiedGameRecord } from "./UnifiedGameRecord";

export interface GameMetadata {
	rounds: RoundMetadata[];
}

export interface RoundMetadata {
	events: UnifiedGameLogEvent[];
}

export function buildGameMetadata(unifiedGameRecord: UnifiedGameRecord): GameMetadata {
	const gameMetadata: GameMetadata = {
		rounds: [],
	};

	const events = [...unifiedGameRecord.gameLog];

	let round: RoundMetadata = {
		events: [],
	};
	while (events.length) {
		const event = events.shift();
		round.events.push(event);
		switch(event.type) {
		case UnifiedGameLogEventType.EndOfWall:
		case UnifiedGameLogEventType.WinDeclared: {
			gameMetadata.rounds.push(round);
			round = {
				events: [],
			};
			break;
		}
		}
	}

	if (round.events.length) {
		gameMetadata.rounds.push(round);
	}

	return gameMetadata;
}
