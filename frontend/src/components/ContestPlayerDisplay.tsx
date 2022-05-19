import * as React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Rest } from "majsoul-api";
import { useDispatch, useSelector } from "react-redux";
import Accordion from "react-bootstrap/Accordion";
import { TeamIcon } from "./TeamIcon";
import { IState } from "src/State";
import { getSeatCharacter } from "./GameResultSummary";
import { fetchContestPlayerGames } from "src/api/Games";
import { dispatchGamesRetrievedAction } from "src/actions/games/GamesRetrievedAction";
import * as dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { PaipuLink } from "./PaipuLink";

export function ContestPlayerDisplay(props: {
	contestId: string;
	contestPlayer: Rest.ContestPlayer;
	team: string;
	ignoredGames?: number;
}): JSX.Element {
	const { t } = useTranslation();
	const games = useSelector((state: IState) => {
		if (state.games == null) {
			return [];
		}

		return Object.values(state.games)
			.filter(game => game.contestId === props.contestId
				&& game.players.findIndex(p => p?._id === props.contestPlayer._id) >= 0);
	});

	const maxGames = useSelector((state: IState) => state.contestsById[props.contestId].maxGames ?? Infinity);

	const {
		ignoredGames = 0,
	} = props;

	const dispatch = useDispatch();
	const [loadGames, setLoadGames] = React.useState(false);
	React.useEffect(() => {
		if (!loadGames) {
			return;
		}

		fetchContestPlayerGames(props.contestId, props.contestPlayer._id)
			.then(games => dispatchGamesRetrievedAction(dispatch, games));
	}, [props.contestId, props.contestPlayer._id, loadGames]);

	const gamesPlayed = Math.max(0, props.contestPlayer.gamesPlayed - ignoredGames);

	return <Accordion as={Container} className="p-0">
		<Accordion.Toggle as={Row} eventKey="0" className="no-gutters align-items-center flex-nowrap" onClick={() => setLoadGames(true)} style={{ cursor: "pointer" }}>
			<Col md="auto" style={{ minWidth: 50 }} className="mr-3 text-right"> <h5><b>{props.contestPlayer.tourneyRank + 1}位</b></h5></Col>
			<TeamIcon team={props.team} seeded={props.contestPlayer.team.seeded} contestId={props.contestId} />
			<Col className="text-nowrap" style={{ flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold h5 text-truncate" style={{ borderBottom: `3px solid ${gamesPlayed >= maxGames ? "LightGreen" : "grey"}` }}>
							{props.contestPlayer.nickname}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col md="auto" className="mr-3"> <h5><b>{props.contestPlayer.tourneyScore / 1000}</b></h5></Col>
			<Col md="auto" className="mr-3"> <h5><b>{Math.min(maxGames, gamesPlayed)}戦</b></h5></Col>
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<Container>
				{games.sort((a, b) => b.start_time - a.start_time)
					.slice(-ignoredGames - Math.min(maxGames, gamesPlayed), ignoredGames ? -ignoredGames : undefined)
					.map(game => {
						const playerSeat = game.players.findIndex(p => p?._id === props.contestPlayer._id);
						const position = game.finalScore
							.map((score, seat) => ({ score, seat }))
							.sort((a, b) => b.score.uma - a.score.uma)
							.findIndex(r => r.seat === playerSeat);
						return <Row key={game._id}>
							<Col md="auto">
								{getSeatCharacter(playerSeat)}
							</Col>

							<Col md="auto">
								{position + 1}位
							</Col>

							<Col>
								{game.finalScore[playerSeat].uma / 1000}
							</Col>

							<Col md="auto">
								{dayjs(game.start_time).calendar()}
							</Col>

							<Col md="auto">
								<PaipuLink majsoulId={game.majsoulId} />
							</Col>
						</Row>;
					})}
			</Container>
		</Accordion.Collapse>
	</Accordion>;
}
