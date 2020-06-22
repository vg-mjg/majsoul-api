import * as React from "react";
import { Session, ContestTeam } from "../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as moment from "moment-timezone";
import { CountdownTimer } from "./CountdownTimer";
import { Match } from "./Match";

interface PendingSessionProps {
	teams: Record<string, ContestTeam>;
	session: Session;
}

export class PendingSession extends React.Component<PendingSessionProps> {
	render() {
		if (this.props.session == null) {
			return null;
		}

		return <Container fluid className="bg-dark rounded text-light">
			<Row className="py-3 px-2">
				<Col md="auto">
					<Container>
						<Row>
							{moment(this.props.session.scheduledTime).tz("UTC").format("LT l")} UTC
						</Row>
						<Row>
							{moment(this.props.session.scheduledTime).calendar()} in {moment.tz.guess()}
						</Row>
					</Container>
				</Col>
				<Col className="text-right align-self-center">
					<CountdownTimer targetTime={this.props.session.scheduledTime}></CountdownTimer>
				</Col>
			</Row>
			<Row>
				{this.props.session.plannedMatches.map((match, index) => <Container className="mx-2 mb-2 px-0" key={index}><Match match={match} teams={this.props.teams}></Match></Container>
				)}
			</Row>
		</Container>;
	}
}
