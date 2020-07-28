import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { fetchContestSummary, fetchContestSessions, ActionType } from "../Actions";
import { IState, Contest } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Session } from "./Session";
import { Teams } from "./Teams";
import YouTube from 'react-youtube';

function SongPlayer(props: {videoId: string, play?: boolean}): JSX.Element {
	const [player, setPlayer] = React.useState<YT.Player>(null);
	React.useEffect(() => {
		if (player == null || !props.play) {
			return;
		}
		player.playVideo();
		return () => player.stopVideo();
	}, [player, props.play, props.videoId]);
	return <div style={{display:"none"}}>
		<YouTube
			videoId={props.videoId}
			onReady={(event) => setPlayer(event.target)}
			onStateChange={(event) => event.data === 0 && event.target.playVideo()}
		>
		</YouTube>
	</div>
}

export function ContestSummary(props: {contestId: string}): JSX.Element {
	const contest = useSelector((state: IState) => state.contest);
	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchContestSummary(dispatch, props.contestId);
		fetchContestSessions(dispatch, props.contestId);
	}, [props.contestId]);

	const [secret, setSecret] = React.useState(false);
	React.useEffect(() => {
		if (!secret) {
			return;
		}
		new Audio(require("../../assets/tuturu.mp3").default).play();
		setTimeout(() => setSecret(false), 5000);
	}, [secret]);

	return <Container>
		<Row className="px-4 pt-4 pb-3 no-gutters align-items-center">
			<Col md="auto">
				<h1 onClick={() => setSecret(true)}><u style={{cursor: "pointer"}}>{contest?.name}</u></h1>
			</Col>
			<Col md="auto">
				<i>
					{secret
						? "They said I could be anything, so I became yakitori."
						: "We're going down, and sugar we're going down swinging."}
					</i>
				</Col>
		</Row>

		{contest != null ? <LeagueContestSummary contest={contest}/> : null}

		<Row className="mt-3 justify-content-center">
			<Col md="auto"><a className="text-dark" href="https://boards.4channel.org/vg/catalog#s=mjg">/mjg/</a></Col>
			<Col md="auto"><a className="text-dark" href="https://repo.riichi.moe/">Repo</a></Col>
			<Col md="auto"><a className="text-dark" href="https://github.com/riichinomics/majsoul-api">Source Code/Report Issue</a></Col>
		</Row>
	</Container>
}

export function TournamentContestSummary(): JSX.Element {
	return null;
}

export function LeagueContestSummary(props: {contest: Contest}): JSX.Element {
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
