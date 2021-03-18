import * as React from "react";
import { LeagueStandingChart } from "./league/LeagueStandingChart";
import { fetchContestSummary, fetchContestSessions, ActionType, fetchGamesHook } from "../Actions";
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

export function ContestSummary(props: {contestId: string}): JSX.Element {
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchContestSummary(dispatch, props.contestId.toString());
		fetchContestSessions(dispatch, props.contestId.toString());
	}, [props.contestId]);

	const [secret, setSecret] = React.useState(false);
	React.useEffect(() => {
		if (!secret) {
			return;
		}
		// new Audio(nantoka_nare as any).play()
	}, [secret]);

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
				<h1 onClick={() => setSecret(true)}><u style={{cursor: "pointer"}}>{contest?.name}</u></h1>
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

export const maxGames = 4;

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

	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchGamesHook(dispatch, {
			contestIds: [props.contestId],
			last: 4,
		});
	}, [props.contestId]);

	return <>
		<Row className="mt-3">
			{props.contestId === "601bb7c2ad32bacea6d8d92c"
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

function LeagueContestSummary(props: {contest: Contest}): JSX.Element {
	const games = useSelector((state: IState) => Object.values(state.games ?? [])?.sort((a, b) => b.end_time - a.end_time));
	const musicPlayer = useSelector((state: IState) => state.musicPlayer);
	const dispatch = useDispatch();

	const contest = props.contest;

	const nextSessionIndex = contest?.sessions?.findIndex(session => session.scheduledTime > Date.now()) ?? -1;
	const nextSession = contest?.sessions == null ? null : contest.sessions[nextSessionIndex];
	const currentSession = contest?.sessions == null ? null : contest.sessions[(nextSessionIndex < 1 ? contest.sessions.length : nextSessionIndex) - 1];

	React.useEffect(() => {
		if (nextSession != null || currentSession == null || musicPlayer.playing || contest?.teams == null) {
			return;
		}

		if (games.filter(g => g.start_time > currentSession.scheduledTime).length < 4) {
			return;
		}

		const firstPlace = Object.entries(currentSession.aggregateTotals).map(([teamId, score]) => ({teamId, score})).sort((a, b) => b.score - a.score)[0];
		const anthem = contest.teams[firstPlace.teamId]?.anthem;
		if (anthem == null) {
			return;
		}

		dispatch({
			type: navigator.userAgent.indexOf('Firefox') != -1 ? ActionType.SetMusic : ActionType.PlayMusic,
			videoId: anthem
		});
	}, [nextSession, currentSession, contest?.teams]);

	if (contest == null) {
		return null;
	}

	return <>
		<Row className="mt-3">
			<Teams session={currentSession} />
		</Row>
		<Row className="mt-3">
			<LeagueStandingChart/>
		</Row>
		{ nextSession != null && <>
			<Row className="px-4 py-3 justify-content-end" >
				<Col md="auto" className="h4 mb-0"><u>Next Session</u></Col>
			</Row>
			<Row>
				<Session session={nextSession}></Session>
			</Row>
		</>}
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Recent Session</u></Col>
		</Row>
		<Row>
			<Session session={currentSession}></Session>
		</Row>
	</>
}


