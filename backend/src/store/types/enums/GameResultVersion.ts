export enum GameResultVersion {
	None,
	First,
	Second,
	Third,
	Fourth
}

export const latestGameResultVersion = Object.values(GameResultVersion).length / 2 - 1 as GameResultVersion;
