import * as React from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import { useHistory, useLocation } from "react-router-dom";
import { PlayerStandings } from "./PlayerStandings";

const brackets: Record<string, Array<string>> = {
	"achiga": [
		"Achiga",
		"Shiraitodai",
		"Senriyama",
		"Shindouji",
	],
	"kiyosumi":	[
		"Kiyosumi",
		"Eisui",
		"Miyamori",
		"Himematsu",
	]
}

export function BracketPlayerStandings(props: { contestId: string; }): JSX.Element {
	const history = useHistory();
	const hash = useLocation().hash.toLowerCase().substr(1);
	const activeSide = hash in brackets ? hash : "achiga";

	return <Container>
		<Nav
			justify
			variant="tabs"
			activeKey={activeSide}
			className="rounded-top text-light"
			style={{
				backgroundColor: "black"
			}}
			onSelect={(key: string) => {
				history.push({
					hash: `#${key}`,
				});
			}}
		>
			<Nav.Item className="rounded-0">
				<Nav.Link eventKey="achiga" className="h3 m-0 rounded-0">阿知賀側</Nav.Link>
			</Nav.Item>
			<Nav.Item className="rounded-0">
				<Nav.Link eventKey="kiyosumi" className="h3 m-0 rounded-0">清澄側</Nav.Link>
			</Nav.Item>
		</Nav>
		<PlayerStandings contestId={props.contestId} allowedTeams={brackets[activeSide]} ignoredGames={activeSide === "achiga" ? 0 : 4} />
	</Container>;
}
