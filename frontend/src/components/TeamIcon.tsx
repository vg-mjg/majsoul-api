import * as React from "react";
import Badge from "react-bootstrap/Badge";
import { useSelector } from "react-redux";

import { IState } from "../State";

const sakiTeamInfo: Record<string, Record<string, {color:string, name:string, blackFont?: boolean}>> = {
	"236728": {
		"Kazekoshi": {
			color: "#ffd966",
			name: "風越",
		},
		"Kiyosumi": {
			color: "#6fa8dc",
			name: "清澄",
		},
		"Ryuumonbuchi": {
			color: "#e06666",
			name: "龍門渕",
		},
		"Tsuruga": {
			color: "#b4a7d6",
			name: "敦賀",
		},
		"Achiga": {
			color: "#df8cea",
			name: "阿知賀",
		},
		"Shiraitodai": {
			color: "#3e5bdd",
			name: "白糸台",
		},
		"Senriyama": {
			color: "#cea84e",
			name: "千里山",
		},
		"Shindouji": {
			color: "#7954d8",
			name: "新道寺",
		},
		"Eisui": {
			color: "#ee0000",
			name: "永水",
		},
		"Miyamori": {
			color: "#71ba50",
			name: "宮守",
		},
		"Himematsu": {
			color: "#d3b700",
			name: "姫松",
		}
	},

	"635236" : {
		"Kazekoshi": {
			color: "#ffd966",
			name: "風越"
		},
		"Kiyosumi": {
			color: "#6fa8dc",
			name: "清澄"
		},
		"Ryuumonbuchi": {
			color: "#e06666",
			name: "龍門渕"
		},
		"Tsuruga": {
			color: "#b4a7d6",
			name: "敦賀"
		}
	}
};

export function TeamIcon(props: {
	team: string;
	seeded: boolean;
	contestId: string;
}): JSX.Element {
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	if (!(contest.majsoulFriendlyId in sakiTeamInfo)) {
		return null;
	}

	if (sakiTeamInfo[contest.majsoulFriendlyId] == null) {
		return null;
	}

	const team = sakiTeamInfo[contest.majsoulFriendlyId][props.team];

	return <h4 className="pr-2 text-dark">
		{props.seeded
			? <Badge className={`bg-light ${props.team ? "mr-2" : ""}`}>
				シード
			</Badge>
			: null}
		{props.team
			? <Badge style={{
				backgroundColor: team.color,
				color: team.blackFont ? undefined : "white"
			}}>
				{team.name}
			</Badge>
			: null}
	</h4>;
}
