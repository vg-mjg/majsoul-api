import * as React from "react";
import { findPlayerInformation, IState } from "../State";
import { Rest } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as styles from "./styles.sass";
import { useDispatch, useSelector } from "react-redux";
import { levelToString, pickColorGradient } from "./utils";
import { TeamImage } from "./TeamImage";
import dayjs = require("dayjs");
import { useTranslation } from "react-i18next";
import { css } from "astroturf";
import clsx from "clsx";
import { updateGame } from "src/api/Games";
import { dispatchGamesRetrievedAction } from "src/actions/games/GamesRetrievedAction";
import { TourneyContestPhaseSubtype } from "majsoul-api/dist/store/types";
import { PaipuLink } from "./PaipuLink";

function GameSeat(props: {
	seat: number,
	game: Rest.GameResult
}): JSX.Element {
	const contest = useSelector((state: IState) => state.contestsById[props.game.contestId]);

	const hideTeams = contest.subtype === TourneyContestPhaseSubtype.TeamQualifier;

	const teams = contest?.teams;

	if (contest == null) {
		return null;
	}

	const playerId = props.game.players[props.seat];
	const player = playerId == null
		? {
			_id: null as string,
			nickname: `AI (${(levelToString(props.game.config?.aiLevel) as string)})`,
			displayName: null as string,
		}
		: contest?.players?.find(p => p._id === playerId._id);

	if (player == null) {
		return null;
	}

	const playerInformation = findPlayerInformation(player._id, teams);

	const scoreColor = pickColorGradient(
		props.game.finalScore[props.seat].uma > 0 ? "93c47d" : "e06666",
		"ffd966",
		Math.min(Math.abs(props.game.finalScore[props.seat].uma / 1000 / 50), 1)
	);

	return <Container className={`font-weight-bold p-0 rounded bg-primary text-dark border border-2`}>
		<Row className={`no-gutters`} style={{ lineHeight: "40px", textAlign: "center" }}>
			<Col
				md="auto"
				className={`${(styles as any)[`seat-${props.seat}`]} rounded-left border-right border-2`}
				style={{ minWidth: "40px", boxSizing: "content-box" }}
			>
				{getSeatCharacter(props.seat)}
			</Col>
			<Col
				md="auto"
				className="border-right border-2"
				style={{ minWidth: "40px", boxSizing: "content-box" }}
			>
				{props.game.finalScore.map((score, index) => ({ score, index })).sort((a, b) => b.score.uma - a.score.uma).findIndex(s => s.index === props.seat) + 1}
			</Col>
			{!hideTeams && playerInformation?.team &&
				<Col
					md="auto"
					className="border-right border-2"
				>
					<TeamImage team={playerInformation?.team} />
				</Col>
			}
			<Col
				className="border-right border-2"
			>
				<div
					style={{
						lineHeight: "initial",
						display: "inline-block",

						borderBottom: playerInformation?.team?.color ? `solid 3px #${playerInformation.team.color}` : "none"
					}}
				>
					{player.displayName ?? player.nickname}
				</div>
			</Col>
			<Col md="auto" style={{ minWidth: "112px", backgroundColor: `rgb(${scoreColor.r}, ${scoreColor.g}, ${scoreColor.b})` }} className="rounded-right">
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


const localStyles = css`
	.hidden {
		opacity: 0.5;
	}
`;

//todo: use wind enum from types package
export function GameResultSummary(props: {
	game: Rest.GameResult,
}): JSX.Element {
	const token = useSelector((state: IState) => state.user?.token);
	const dispatch = useDispatch();
	const endTime = React.useMemo(() => dayjs(props.game?.end_time).calendar(), [props.game?.end_time]);
	const { t } = useTranslation();
	const cellStyle = "mb-1 pl-0 pr-1";
	const rowStyle = "pl-1 no-gutters";

	if (!props.game) {
		return null
	}


	return <Container className={clsx("px-1 py-2", props.game.hidden && localStyles.hidden)}>
		<Row className={`${rowStyle} px-2 pb-2`}>
			<Col>
				{endTime}
			</Col>
			{token && <Col>
				<div className={clsx(styles.linkDark, styles.linkUnderline)} onClick={() => {
					updateGame(token, props.game._id, { hidden: !props.game.hidden })
						.then(game => {
							dispatchGamesRetrievedAction(dispatch, [game]);
						})
				}}>
					{props.game.hidden ? "Show" : "Hide"}
				</div>
			</Col>}
			<Col md="auto">
				<PaipuLink majsoulId={props.game.majsoulId} />
			</Col>
		</Row>
		{props.game.players
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
