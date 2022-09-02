import * as React from "react";
import { Rest } from "backend";
import { KhanStats } from "backend/dist/rest/types/stats/KhanStats";
import { StatsVersion } from "backend/dist/rest/types/stats/StatsVersion";
import { FirstStatsDisplay } from "./FirstStatsDisplay";
import { BaseStatsDisplay } from "./BaseStatsDisplay";


export function VersionedStatsDisplay(props: { stats: Rest.Stats; }) {
	if (props?.stats?.stats == null) {
		return null;
	}

	switch (props.stats.version) {
		case StatsVersion.None:
			return <BaseStatsDisplay stats={props.stats.stats} />;
		case StatsVersion.First:
		case StatsVersion.Khan:
			return <FirstStatsDisplay stats={props.stats.stats as KhanStats["stats"]} />;
	}

	return null;
}
