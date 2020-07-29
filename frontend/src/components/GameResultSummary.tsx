import * as React from "react";
import { findPlayerInformation, IState } from "../State";
import { Store, Rest } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as moment from "moment-timezone";
import * as styles from "./styles.sass";
import { pickColorGradient } from "..";
import { useSelector, useDispatch } from "react-redux";
import { fetchContestPlayers } from "../Actions";

function GameSeat(props: {
	seat: number,
	game: Rest.GameResult
}): JSX.Element {
	const teams = useSelector((state: IState) => state.contest.teams);

	const playerId = props.game.players[props.seat];
	const player = useSelector((state: IState) => {
		return state.contest.players?.find(p => p._id === playerId._id);
	});

	const dispatch = useDispatch();

	React.useEffect(() => {
		if (player != null) {
			return;
		}

		fetchContestPlayers(dispatch, props.game.contestId);
	}, [props.game.contestId]);

	if (player == null) {
		return null;
	}

	const colorIndex = findPlayerInformation(player._id, teams)?.team ?? props.seat + 2;

	const scoreColor = pickColorGradient(
		props.game.finalScore[props.seat].uma > 0 ? "93c47d" : "e06666",
		"ffd966",
		Math.min(Math.abs(props.game.finalScore[props.seat].uma / 1000 / 50), 1)
	);

	return <Container className={`font-weight-bold p-0 rounded bg-primary text-dark`}>
		<Row className="no-gutters">
			<Col md="auto" className={`${(styles as any)[`team${colorIndex}`]} rounded-left px-2`}>
				{getSeatCharacter(props.seat)}
			</Col>
			<Col md="auto" className="border-right border-top border-bottom px-2">
				{props.game.finalScore.map((score, index) => ({ score, index })).sort((a, b) => b.score.uma - a.score.uma).findIndex(s => s.index === props.seat) + 1}
			</Col>
			<Col className="border-right border-top border-bottom text-center">
				{player.nickname}
			</Col>
			<Col md="auto" style={{ minWidth: "112px", backgroundColor: `rgb(${scoreColor.r}, ${scoreColor.g}, ${scoreColor.b})` }} className="text-center border-right border-top border-bottom rounded-right">
				{props.game.finalScore[props.seat].score}({props.game.finalScore[props.seat].uma / 1000})
			</Col>
		</Row>
	</Container>;
}

export function getSeatCharacter(seat: number): string {
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

//todo: use wind enum from types package
export function GameResultSummary(props: {game: Rest.GameResult}): JSX.Element {
	const cellStyle = "mb-1 pl-0 pr-1";
	const rowStyle = "pl-1 no-gutters";
	return <Container className="px-1 py-2">
		<Row className={`${rowStyle} px-2 pb-2`}>
			<Col className="">
				{moment(props.game.end_time).calendar()}
			</Col>
			<Col md="auto" className="">
				<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${props.game.majsoulId}`} rel="noreferrer" target="_blank">View on Majsoul</a>
			</Col>
		</Row>
		{ props.game.players
			.map((_, seat) => seat)
			.sort((a, b) => props.game.finalScore[b].uma - props.game.finalScore[a].uma)
			.map(seat => <Row key={seat} className={rowStyle}>
				<Col className={cellStyle}>
					<GameSeat seat={seat} game={props.game} />
				</Col>
			</Row>
		)}
	</Container>;
}
