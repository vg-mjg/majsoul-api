import * as React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { Rest } from "majsoul-api";
import { fetchActivePhase } from "src/api/Contests";
import { IndividualPlayerStandings } from "./IndividualPlayerStandings";

export function PhaseStandings(props: {
	contestId: string;
}): JSX.Element {
	const [phase, setPhase] = React.useState<Rest.TourneyPhase>(null);

	React.useEffect(() => {
		setPhase(null);
		fetchActivePhase(props.contestId).then(setPhase);
	}, [props.contestId]);

	return <Container className="rounded-bottom bg-dark text-light text-center px-3 py-4">
		{phase?.standings == null
			? <Row>
				<Col>
					<Spinner animation="border" role="status">
						<span className="sr-only">Loading...</span>
					</Spinner>
				</Col>
			</Row>
			: phase.standings
				.map((data, index) => <Row key={data.player._id} className={`${index > 0 ? "mt-3" : ""} no-gutters`} style={{ maxWidth: 640, margin: "auto" }}>
					<IndividualPlayerStandings {...data} contestId={props.contestId} />
				</Row>
				)}
	</Container>;
}
