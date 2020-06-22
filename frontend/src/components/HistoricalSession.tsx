import * as React from "react";
import { ContestTeam } from "../State";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { GameResultSummary } from "./GameResultSummary";
interface HistoricalSessionProps {
	teams: Record<string, ContestTeam>;
	games: Store.GameResult[];
}
export class HistoricalSession extends React.Component<HistoricalSessionProps> {
	render() {
		if (this.props?.games == null) {
			return null;
		}

		return <Container className="bg-dark text-white rounded">
			<Row className="px-4 pt-3 pb-2">
				<Col></Col>
				<Col md="auto" className="h3">Recent Games</Col>
			</Row>
			<Row>
				{this.props.games.map(game => <Container key={game._id} className="px-0 border-top">
					<GameResultSummary game={game} teams={this.props.teams}></GameResultSummary>
				</Container>
				)}
			</Row>
		</Container>;
	}
}
