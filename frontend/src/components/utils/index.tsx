import { AILevel } from "majsoul-api/dist/majsoul/types";
import { Contest } from "src/State";

export function levelToString(aiLevel: AILevel): string {
	switch(aiLevel) {
		case AILevel.Easy:
		return "Easy";
		case AILevel.Normal:
		return "Normal";
		case AILevel.Hard:
		return "Hard";
	}
}

export function contestName(contest: Contest): string {
	return contest.displayName ?? contest.name ?? `#${contest._id}`;
}

type RecordableKeys<T> = {
	[K in keyof T]:
	T[K] extends string
	? K
	: never
}[keyof T]

export function toRecord<
T extends Partial<{ [P in RecordableKeys<T>]: string }>,
K extends RecordableKeys<T>
>(array: T[], selector: K): Record<string, T> {
	if (array == null) {
		return {};
	}
	return array.reduce((acc, item) => (acc[item[selector]] = item, acc), {} as Record<T[K], T>)
}