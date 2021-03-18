import * as React from "react";
import { fetchContestPlayersDirect } from "../Actions";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { Rest } from "majsoul-api";
import { maxGames } from "./ContestSummary";
import { ContestPlayerDisplay } from "./ContestPlayerDisplay";

function contestPlayerTeamSort(params: {player: Rest.ContestPlayer<any>, team: string}): number {
	if (params.player.team.seeded && params.team != null) {
		return 1;
	}
	return 0;
}

export function PlayerStandings(props: {
	contestId: string;
	allowedTeams?: Array<string>;
	ignoredGames?: number;
}): JSX.Element {
	const [contestPlayers, setContestPlayers] = React.useState<Array<Rest.ContestPlayer<any>>>(null);

	React.useEffect(() => {
		setContestPlayers(null);
		fetchContestPlayersDirect({
			contestId: props.contestId,
			gameLimit: maxGames,
			ignoredGames: props.ignoredGames
		}).then(setContestPlayers);
	}, [props.contestId, props.ignoredGames]);

	return <Container className="rounded-bottom bg-dark text-light text-center px-3 py-4">
		{contestPlayers == null
			? <Row>
				<Col>
					<Spinner animation="border" role="status">
						<span className="sr-only">Loading...</span>
					</Spinner>
				</Col>
			</Row>
			: contestPlayers
				.map(player => ({
					player,
					team: props.allowedTeams == null ? player.team.teams[0] : props.allowedTeams.find(team => player.team.teams.indexOf(team) >= 0)
				}))
				.sort((a, b) => contestPlayerTeamSort(b) - contestPlayerTeamSort(a))
				.map((player, placing) => <Row key={player.player._id} className={`${placing > 0 ? "mt-3" : ""} no-gutters`} style={{ maxWidth: 640, margin: "auto" }}>
					<ContestPlayerDisplay contestId={props.contestId} contestPlayer={player.player} team={player.team} ignoredGames={props.ignoredGames} />
				</Row>
				)}
	</Container>;
}