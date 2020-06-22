import * as React from "react";
import { ContestTeam } from "../State";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import * as styles from "./styles.sass";
interface IMatchProps {
	teams: Record<string, ContestTeam>;
	match: Store.Match;
}
export class Match extends React.Component<IMatchProps> {
	private createButton(teamIndex: number) {
		const team = this.props.teams[this.props.match.teams[teamIndex]._id];
		return <Button block disabled className={`${(styles as any)[`team${team.index}`]} font-weight-bold text-uppercase p-0`}>{team.name}</Button>;
	}

	render() {
		const cellStyle = "mb-1 pl-0 pr-1";
		const rowStyle = "pl-1";
		return <Container className="bg-primary pt-1 rounded">
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(0)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(1)}
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(2)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(3)}
				</Col>
			</Row>
		</Container>;
	}
}
