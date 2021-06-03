import * as React from "react";
import { Rest } from "majsoul-api";
import { StatsVersion } from "majsoul-api/dist/rest/types/stats/StatsVersion";
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
			return <FirstStatsDisplay stats={props.stats.stats} />;
	}

	return null;
}
