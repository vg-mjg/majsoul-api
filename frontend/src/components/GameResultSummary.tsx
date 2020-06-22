import * as React from "react";
import { ContestTeam, findPlayerInformation } from "../State";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as moment from "moment-timezone";
import * as styles from "./styles.sass";
import { pickColorGradient } from "..";
interface GameResultSummaryProps {
	teams: Record<string, ContestTeam>;
	game: Store.GameResult;
}
//todo: use wind enum from types package
export class GameResultSummary extends React.Component<GameResultSummaryProps> {
	private static getSeatCharacter(seat: number): string {
		switch (seat) {
			case 0:
				return "東";
			case 1:
				return "南";
			case 2:
				return "西";
			case 3:
				return "北";
		}
		return null;
	}


	private createButton(seat: number) {
		const player = this.props.game.players[seat];
		const playerInfo = findPlayerInformation(player._id, this.props.teams);
		const scoreColor = pickColorGradient(
			this.props.game.finalScore[seat].uma > 0 ? "93c47d" : "e06666",
			"ffd966",
			Math.min(Math.abs(this.props.game.finalScore[seat].uma / 1000 / 50), 1)
		);
		return <Container className={`font-weight-bold p-0 rounded bg-primary text-dark`}>
			<Row className="no-gutters">
				<Col md="auto" className={`${(styles as any)[`team${playerInfo.team.index}`]} rounded-left px-2`}>
					{GameResultSummary.getSeatCharacter(seat)}
				</Col>
				<Col md="auto" className="border-right border-top border-bottom px-2">
					{this.props.game.finalScore.map((score, index) => ({ score, index })).sort((a, b) => b.score.uma - a.score.uma).findIndex(s => s.index === seat) + 1}
				</Col>
				<Col className="border-right border-top border-bottom text-center">
					{playerInfo.player.displayName}
				</Col>
				<Col md="auto" style={{ minWidth: "112px", backgroundColor: `rgb(${scoreColor.r}, ${scoreColor.g}, ${scoreColor.b})` }} className="text-center border-right border-top border-bottom rounded-right">
					{this.props.game.finalScore[seat].score}({this.props.game.finalScore[seat].uma / 1000})
				</Col>
			</Row>
		</Container>;
	}

	render() {
		const cellStyle = "mb-1 pl-0 pr-1";
		const rowStyle = "pl-1 no-gutters";
		return <Container className="px-1 py-2">
			<Row className={`${rowStyle} px-2 pb-2`}>
				<Col className="">
					{moment(this.props.game.end_time).calendar()}
				</Col>
				<Col md="auto" className="">
					<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${this.props.game.majsoulId}`} rel="noreferrer" target="_blank">View on Majsoul</a>
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(0)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(3)}
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(1)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(2)}
				</Col>
			</Row>
		</Container>;
	}
}
