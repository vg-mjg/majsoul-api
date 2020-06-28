import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { fetchContestSummary, fetchContestSessions } from "../Actions";
import { IState } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Session } from "./Session";
import { Teams } from "./Teams";
import { Link } from "react-router-dom";

export function ContestSummary(this: void, props: {contestId: string}): JSX.Element {
	const contest = useSelector((state: IState) => state.contest);
	const games = useSelector((state: IState) => Object.values(state.games ?? [])?.sort((a, b) => b.end_time - a.end_time));
	const dispatch = useDispatch();
	const [secret, setSecret] = React.useState(false);
	React.useEffect(() => {
		if (!secret) {
			return;
		}
		new Audio(require("../../assets/tuturu.mp3").default).play();
		setTimeout(() => setSecret(false), 5000);
	}, [secret]);

	React.useEffect(() => {
		fetchContestSummary(dispatch, props.contestId);
		fetchContestSessions(dispatch, props.contestId);
	}, [props.contestId]);

	if (contest?.sessions == null) {
		return null;
	}

	const nextSessionIndex = contest.sessions.findIndex(session => session.scheduledTime > Date.now());
	const nextSession = contest.sessions[nextSessionIndex];
	const currentSession = contest.sessions[(nextSessionIndex < 1 ? contest.sessions.length : nextSessionIndex) - 1];

	return <Container>
		<Row className="px-4 pt-4 pb-3">
			<Col>
				<h1 className="align-self-center" onClick={() => setSecret(true)}><u style={{cursor: "pointer"}}>{contest.name}</u></h1>
			</Col>
			<Col md="auto" className="align-self-center">
				<i>
					{secret
						? "They said I could be anything, so I became yakitori."
						: "We're going down, and sugar we're going down swinging."}
					</i>
				</Col>
		</Row>
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
		<Row className="mt-3 justify-content-center">
			<Col md="auto"><a className="text-dark" href="https://boards.4channel.org/vg/catalog#s=mjg">/mjg/</a></Col>
			<Col md="auto"><a className="text-dark" href="https://mjg-repo.neocities.org/">Repo</a></Col>
			<Col md="auto"><a className="text-dark" href="https://github.com/riichinomics/majsoul-api">Source Code/Report Issue</a></Col>
		</Row>
	</Container>
}
