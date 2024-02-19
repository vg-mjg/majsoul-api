import type { Rest } from "backend";
import { StatsVersion } from "backend/dist/rest/enums";
import * as React from "react";

import { BaseStatsDisplay } from "./BaseStatsDisplay";
import { FirstStatsDisplay } from "./FirstStatsDisplay";


export function VersionedStatsDisplay(props: { stats: Rest.Stats; }) {
	if (props?.stats?.stats == null) {
		return null;
	}

	switch (props.stats.version) {
		case StatsVersion.None:
			return <BaseStatsDisplay stats={props.stats.stats} />;
		case StatsVersion.First:
		case StatsVersion.Khan:
			return <FirstStatsDisplay stats={props.stats.stats as Rest.KhanStats["stats"]} />;
	}

	return null;
}
