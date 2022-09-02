export enum StatsVersion {
	Undefined,
	None,
	First,
	Khan,
}

export const latestStatsVersion: StatsVersion = Object.values(StatsVersion).length / 2 - 1;
