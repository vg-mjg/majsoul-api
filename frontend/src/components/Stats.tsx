import * as React from "react";
import { Rest } from "majsoul-api";

export function Stats(props: { stats: Rest.Stats }): JSX.Element {
	if (props.stats == null) {
		return null;
	}

	const stats = props.stats.stats;

	return <div>
		{stats.gamesPlayed};
	</div>
}
