import * as React from "react";
import { Session, ContestTeam, IState } from "../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as moment from "moment-timezone";
import { CountdownTimer } from "./CountdownTimer";
import { Match } from "./Match";
import { useSelector, useDispatch } from "react-redux";
import { GameResultSummary } from "./GameResultSummary";
import { fetchGamesHook } from "../Actions";

export function Session(props: {
	session: Session;
}): JSX.Element{
	const teams = useSelector((state: IState) => state.contest.teams);
	const dispatch = useDispatch();
	React.useEffect(() => {
		fetchGamesHook(dispatch, {sessionIds: [props.session._id]});
	}, [props.session._id]);

	return <Container fluid className="bg-dark rounded text-light">
		<Row className="py-3 px-2">
			<Col md="auto">
				<Container>
					<Row>
						{moment(props.session.scheduledTime).tz("UTC").format("LT l")} UTC
					</Row>
					<Row>
						{moment(props.session.scheduledTime).calendar()} in {moment.tz.guess()}
					</Row>
				</Container>
			</Col>
			<Col className="text-right align-self-center">
				<CountdownTimer targetTime={props.session.scheduledTime}></CountdownTimer>
			</Col>
		</Row>
		<Row>
			{props.session.plannedMatches.map((match, index) => <Container className="mx-2 mb-2 px-0" key={index}>
				<Match match={match} teams={teams}/>
			</Container>)}
		</Row>
		<Row>
			{props.session.games?.map((game) => <Container className="mx-2 mb-2 px-0" key={game._id}>
				<GameResultSummary game={game}/>
			</Container>)}
		</Row>
	</Container>;
}
