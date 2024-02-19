import syanten from "syanten";

const suitKeyMap: Record<string, number> = { m: 0, p: 1, s: 2, z: 3 };
export function handToSyantenFormat(hand: string[]): syanten.HaiArr {
	const hai: syanten.HaiArr = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
	];

	for (const t of hand) {
		let num: number = parseInt(t[0]);
		if (0 === num) {
			num = 5;
		}

		hai[suitKeyMap[t[1]]][num - 1]++;
	}

	return hai;
}

