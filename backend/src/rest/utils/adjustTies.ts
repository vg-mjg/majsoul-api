import { GameResult } from "../../store";
import { FinalScore } from "../../store/types/game/FinalScore";

export function adjustTies(game: GameResult<any>): FinalScore[] {
	const finalScore = game.finalScore.map(({ score, uma }) => ({ score, uma }));
	const playersByOrder = [...finalScore].sort((a, b) => a.uma - b.uma);
	const groups = [];
	for (let i = 0; i < playersByOrder.length; i++) {
		const score = playersByOrder[i].score;

		if (groups[0]?.score === score) {
			groups[0].length++;
			continue;
		}

		groups.unshift({
			score,
			start: i,
			length: 1,
		});
	}

	if (groups.length === playersByOrder.length) {
		return game.finalScore;
	}

	const uma = playersByOrder.map(p => p.uma - Math.round(p.score / 100) * 100 + 25000);
	uma[uma.length - 1] = uma.slice(0, -1).reduce((t, n) => t + n, 0);

	let zeroSum = 0;
	let place = 0;

	while (groups.length) {
		const group = groups.pop();
		const groupTotal = groups.length
			? (
				Math.round((group.score - 25000) / 100) * 100 * group.length
				+ uma.slice(place, place + group.length).reduce((t, n) => t + n, 0)
			) : zeroSum;
		zeroSum -= groupTotal;
		place += group.length;
		const individualTotal = groupTotal / group.length;
		for (const player of playersByOrder.slice(group.start, group.start + group.length)) {
			player.uma = individualTotal;
		}
	}
	return finalScore;
}