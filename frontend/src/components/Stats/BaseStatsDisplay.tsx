import { BaseStats } from "majsoul-api/dist/rest/types/stats/BaseStats";


export function BaseStatsDisplay(props: { stats: BaseStats['stats']; }): JSX.Element {
	if (!props.stats) {
		return null;
	}

	return null;
}
