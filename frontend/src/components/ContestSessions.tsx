import { ContestType } from "majsoul-api/dist/store/types/types";
import * as React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useDispatch, useSelector } from "react-redux";
import { dispatchContestImagesFetchedAction } from "src/actions/contests/ContestImagesFetchedAction";
import { dispatchContestSummaryRetrievedAction } from "src/actions/contests/ContestSummaryRetrievedAction";
import { dispatchContestPlayersRetrieved } from "src/actions/players/ContestPlayersRetrievedAction";
import { dispatchContestSessionsRetrievedAction } from "src/actions/sessions/ContestSessionsRetrievedAction";
import { fetchContestImages, fetchContestSummary } from "src/api/Contests";
import { fetchContestPlayers } from "src/api/Players";
import { fetchContestSessions } from "src/api/Sessions";
import { IState } from "../State";
import { Session } from "./Session";

export function ContestSessions(props: {
	contestId: string;
}): JSX.Element {
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchContestImages(contest._id)
			.then(contest => dispatchContestImagesFetchedAction(dispatch, contest));
		fetchContestSummary(props.contestId)
			.then(contest => dispatchContestSummaryRetrievedAction(dispatch, contest));
	}, [props.contestId]);

	React.useEffect(() => {
		if (contest?._id == null) {
			return;
		}

		fetchContestSessions(contest._id)
			.then(sessions => dispatchContestSessionsRetrievedAction(dispatch, contest._id, sessions));

		fetchContestPlayers({
			contestId: contest._id
		}).then(players => dispatchContestPlayersRetrieved(dispatch, contest._id, players));
	}, [contest?._id]);

	if (contest?.sessionsById == null) {
		return null;
	}

	return <Container>
		{Object.values(contest.sessionsById).map(session => <Row key={session._id} className="mt-4">
			<Col>
				<Session session={session}/>
			</Col>
		</Row>)}
	</Container>
}
