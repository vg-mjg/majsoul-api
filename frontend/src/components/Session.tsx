import * as React from "react";
import { Session, IState } from "../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as moment from "moment-timezone";
import { CountdownTimer } from "./CountdownTimer";
import { Match } from "./Match";
import { useSelector, useDispatch, shallowEqual } from "react-redux";
import { GameResultSummary } from "./GameResultSummary";
import { fetchGamesHook, patchSession } from "../Actions";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export function Session(props: {
	session: Session;
}): JSX.Element{
	const teams = useSelector((state: IState) => state.contest.teams, shallowEqual);
	const token = useSelector((state: IState) => state.user?.token);

	const dispatch = useDispatch();
	React.useEffect(() => {
		fetchGamesHook(dispatch, {sessionIds: [props.session._id]});
	}, [props.session._id]);

	const utcStartMoment = moment(props.session.scheduledTime).tz("UTC");

	const [utcMoment, setUtcMoment] = React.useState(utcStartMoment.format("LT l") + " UTC");
	const [timeIsInvalid, setTimeIsValid] = React.useState(!utcStartMoment.isValid());
	const [editTime, setEditTime] = React.useState(false);

	return <Container fluid className="bg-dark rounded text-light">
		<Row className="py-3 px-2">
			<Col md="auto">
				<Container>
					<Row>
						<Form.Control
							plaintext={!token || !editTime}
							readOnly={!token || !editTime}
							isInvalid={timeIsInvalid}
							className={`py-0${(!token || !editTime) ? " text-light" : ""}`}
							value={`${utcMoment}`}
							onChange={event => {
								setUtcMoment(event.target.value)
								setTimeIsValid(!moment(event.target.value).isValid())
							}}
							onFocus={(event: any) => setEditTime(true)}
							onBlur={(event: any) => {
								if (timeIsInvalid) {
									setUtcMoment(moment(props.session.scheduledTime).tz("UTC").format("LT l") + " UTC")
								} else {
									setUtcMoment(moment(event.target.value).tz("UTC").format("LT l") + " UTC")
								}
								setEditTime(false);
							}}
						/>
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
			{props.session.plannedMatches.map((match, index) => <Col className={`mr-2 mb-2 px-0 ${index > 0 ? "" : "ml-2"}`} key={index}>
				<Match match={match} totals={props.session.totals}/>
			</Col>)}
		</Row>
		<Row>
			<Container className="p-0">
				<Row className="no-gutters">
					{props.session.games?.map((game, index) => <React.Fragment key={game._id}>
						<Col style={{minWidth: "auto"}}>
							<GameResultSummary game={game}/>
						</Col>
						{(index % 2 == 1) && <div className="w-100"/>}
					</React.Fragment>)}
				</Row>
			</Container>
		</Row>
		{ (token && !timeIsInvalid && !utcStartMoment.isSame(moment(utcMoment))) &&
			<Row className="pb-3 px-3 justify-content-end">
				<Button
					variant="secondary"
					onClick={(event: any) => patchSession(
						dispatch,
						token,
						{
							_id: props.session._id,
							scheduledTime: moment(utcMoment).valueOf()
						} as Session
					)}
				>Save</Button>
			</Row>
		}
	</Container>;
}
