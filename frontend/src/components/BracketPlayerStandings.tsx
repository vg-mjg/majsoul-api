import * as React from "react";
import Container from "react-bootstrap/Container";
import { useHistory, useLocation } from "react-router-dom";

import { PlayerStandings } from "./PlayerStandings";
import { TabNavigator } from "./TabNavigator";

export const brackets: Record<string, Array<string>> = {
	"achiga": [
		"Achiga",
		"Shiraitodai",
		"Senriyama",
		"Shindouji",
	],
	"kiyosumi": [
		"Kiyosumi",
		"Eisui",
		"Miyamori",
		"Himematsu",
	]
};

export function BracketPlayerStandings(props: { contestId: string; }): JSX.Element {
	const history = useHistory();
	const hash = useLocation().hash.toLowerCase().substr(1);
	const activeSide = hash in brackets ? hash : "achiga";
	return <Container>
		<TabNavigator
			tabs={[
				{
					key: "achiga",
					title: "阿知賀側"
				},
				{
					key: "kiyosumi",
					title: "清澄側"
				},
			]}
			activeTab={activeSide}
			onTabChanged={(key) => {
				history.push({
					hash: `#${key}`,
				});
			}}
		/>
		<PlayerStandings
			contestId={props.contestId}
			allowedTeams={brackets[activeSide]}
			ignoredGames={activeSide === "achiga" ? 0 : 4}
		/>
	</Container>;
}
