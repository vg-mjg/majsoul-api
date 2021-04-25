import * as React from "react";
import { LeagueStandingChart } from "./league/LeagueStandingChart";
import { fetchContestSessions } from "../actions/Actions";
import { IState, Contest } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Session } from "./Session";
import { Teams } from "./Teams";
import { GameResultSummary } from "./GameResultSummary";
import { ContestType } from "majsoul-api/dist/store/types/types";
import { ContestMetadataEditor } from "./ContestMetadataEditor";
import { SongPlayer } from "./utils/SongPlayer";
import { PlayerStandings } from "./PlayerStandings";
import { YakumanDisplay } from "./YakumanDisplay";
import { BracketPlayerStandings } from "./BracketPlayerStandings";
import nantoka_nare from "../../assets/nantoka_nare.mp3";
import { contestName } from "./utils";
import { fetchGames } from "src/api/Games";
import { dispatchGamesRetrievedAction } from "src/actions/games/GamesRetrievedAction";
import { fetchContestPlayers } from "src/api/Players";
import { dispatchContestPlayersRetrieved } from "src/actions/players/ContestPlayersRetrievedAction";
import { fetchContestSummary } from "src/api/Contests";
import { dispatchContestSummaryRetrievedAction } from "src/actions/ContestSummaryRetrievedAction";

export function ContestSummary(props: {contestId: string}): JSX.Element {
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchContestSummary(props.contestId).then(contest => dispatchContestSummaryRetrievedAction(dispatch, contest));
		fetchContestPlayers({
			contestId: props.contestId
		}).then(players => dispatchContestPlayersRetrieved(dispatch, props.contestId, players));
	}, [props.contestId]);

	const [secret, setSecret] = React.useState(false);
	React.useEffect(() => {
		if (!secret) {
			return;
		}

		if (contest.majsoulFriendlyId === 866709) {
			new Audio(nantoka_nare as any).play()
		}
	}, [secret]);

	React.useEffect(() => {
		if (contest == null) {
			return;
		}

		document.title = `/mjg/ competitions - ${contest.name ?? `#${contest._id}`}`;
		return () => {
			document.title = "/mjg/ competitions";
		}
	}, [contest?.name, contest?._id]);

	if (contest == null) {
		return <Container className="text-light text-center pt-4">
			<h5 className="bg-dark rounded py-3">
				Tourney #{props.contestId} doesn&apos;t exist.
			</h5>
		</Container>;
	}

	return <Container>
		{contest.anthem == null ? null : <SongPlayer videoId={contest.anthem} play={secret}/>}
		<Row className="px-4 pt-4 pb-3 no-gutters align-items-center">
			<Col>
				<h1 onClick={() => setSecret(true)}><u style={{cursor: "pointer"}}>{contestName(contest)}</u></h1>
			</Col>
			<Col md="auto">
				<i>
					{!secret
						? (contest.tagline ?? "")
						: (contest.taglineAlternate ?? "")}
					</i>
				</Col>
		</Row>
		<ContestMetadataEditor contestId={contest._id}/>
		{ contest.type === ContestType.League
			? <LeagueContestSummary contest={contest}/>
			: <TourneyContestSummary contestId={contest._id}/>
		}
		<YakumanDisplay contestId={contest._id}/>
	</Container>
}

function TourneyContestSummary(props: {contestId: string}): JSX.Element {
	const games = useSelector((state: IState) => {
		if (state.games == null) {
			return [];
		}

		return Object.values(state.games)
			.filter(game => game.contestId === props.contestId)
			.sort((a, b) => b.start_time - a.start_time)
			.slice(0, 4);
	});

	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	if (contest == null) {
		return null;
	}

	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchGames({
			contestIds: [props.contestId],
			last: 4,
		}).then(games => dispatchGamesRetrievedAction(dispatch, games));
	}, [props.contestId]);

	return <>
		<Row className="mt-3">
			{ contest.majsoulFriendlyId === 236728
				? <BracketPlayerStandings contestId={props.contestId} />
				: <PlayerStandings contestId={props.contestId} />
			}
		</Row>
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Recent Games</u></Col>
		</Row>
		<Row>
			<Container className="p-0 rounded bg-dark text-light px-1 py-2">
				<Row className="no-gutters">
					{games?.map((game, index) => <React.Fragment key={game._id}>
						<Col style={{minWidth: "auto"}}>
							<GameResultSummary game={game}/>
						</Col>
						{(index % 2 == 1) && <div className="w-100"/>}
					</React.Fragment>)}
				</Row>
			</Container>
		</Row>
	</>
}

function LeagueContestSummary(props: { contest: Contest }): JSX.Element {
	const games = useSelector((state: IState) => Object.values(state.games ?? [])?.sort((a, b) => b.end_time - a.end_time));
	const dispatch = useDispatch();

	const { contest } = props;

	const nextSessionIndex = contest?.sessions?.findIndex(session => session.scheduledTime > Date.now()) ?? -1;
	const nextSession = contest?.sessions == null ? null : contest.sessions[nextSessionIndex];
	const currentSession = contest?.sessions == null ? null : contest.sessions[(nextSessionIndex < 1 ? contest.sessions.length : nextSessionIndex) - 1];

	React.useEffect(() => {
		fetchContestSessions(dispatch, contest._id);
	}, [dispatch, contest._id]);

	if (contest?.sessions == null) {
		return null;
	}

	return <>
		<Row className="mt-3">
			<Teams contest={contest} session={currentSession} />
		</Row>
		<Row className="mt-3">
			<LeagueStandingChart contest={contest}/>
		</Row>
		{ nextSession != null && <>
			<Row className="px-4 py-3 justify-content-end" >
				<Col md="auto" className="h4 mb-0"><u>Next Session</u></Col>
			</Row>
			<Row>
				<Session session={nextSession}/>
			</Row>
		</>}
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Recent Session</u></Col>
		</Row>
		<Row>
			<Session session={currentSession}/>
		</Row>
	</>
}


