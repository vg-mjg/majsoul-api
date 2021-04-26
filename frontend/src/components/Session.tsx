import * as React from "react";
import { IState } from "../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as moment from "moment-timezone";
import { CountdownTimer } from "./CountdownTimer";
import { Match } from "./Match";
import { useSelector, useDispatch } from "react-redux";
import { GameResultSummary } from "./GameResultSummary";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { Rest } from "majsoul-api";
import { fetchGames } from "src/api/Games";
import { dispatchGamesRetrievedAction } from "src/actions/games/GamesRetrievedAction";
import Accordion from "react-bootstrap/Accordion";
import { LoadingSpinner } from "./utils/LoadingSpinner";
import { BsChevronCompactDown, BsChevronCompactUp } from "react-icons/bs";
import clsx from "clsx";

enum GamesFetchStatus {
	None,
	Fetching,
	Fetched,
}

export function Session(props: {
	session: Rest.Session<string>;
	forceDetails?: boolean;
}): JSX.Element{
	const [viewDetails, setViewDetails] = React.useState(false);
	const [gamesFetchedStatus, setGamesFetched] = React.useState(GamesFetchStatus.None);
	const detailsOpen = viewDetails || props.forceDetails;

	const token = useSelector((state: IState) => state.user?.token);
	const games = useSelector((state: IState) =>
		Object.values(state.games ?? {})
			.filter(game =>
				game.sessionId === props.session?._id
				&& game.contestId === ""//props.session?.contestId
			)
	);

	const dispatch = useDispatch();
	React.useEffect(() => {
		if (!detailsOpen || gamesFetchedStatus !== GamesFetchStatus.None) {
			return;
		}

		if (props.session?._id == null) {
			return;
		}

		setGamesFetched(GamesFetchStatus.Fetching);

		fetchGames({
			sessionIds: [props.session._id],
			contestIds: [props.session?.contestId],
		}).then(games => {
			setGamesFetched(GamesFetchStatus.Fetched);
			dispatchGamesRetrievedAction(dispatch, games);
		});
	}, [props.session?._id, detailsOpen]);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setViewDetails(accordionKey === "0");
	}, [setViewDetails])

	const utcStartMoment = (props.session == null ? moment() : moment(props.session.scheduledTime)).tz("UTC");

	const [utcMoment, setUtcMoment] = React.useState(utcStartMoment.format("LT l") + " UTC");
	const [timeIsInvalid, setTimeIsValid] = React.useState(!utcStartMoment.isValid());
	const [editTime, setEditTime] = React.useState(false);

	if (props.session == null) {
		return null;
	}

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
			<Col>
				<Accordion
					as={Container}
					className="p-0"
					onSelect={onAccordionSelect}
					activeKey={detailsOpen ? "0" : null}
				>
					<Accordion.Collapse as={Row} eventKey="0">
						<Container className="p-0">
							<Row className="no-gutters">
								{ gamesFetchedStatus === GamesFetchStatus.Fetched
									? games.length === 0
										? <Col className="text-center">
											<div className={clsx("h4 font-weight-bold m-0", props.forceDetails ? "pb-4" : "pb-1")}>未だ無し</div>
										</Col>
										: games.map((game, index) => <React.Fragment key={game._id}>
											<Col style={{minWidth: "auto"}}>
												<GameResultSummary game={game}/>
											</Col>
											{(index % 2 == 1) && <div className="w-100"/>}
										</React.Fragment>)
									: <Col className="text-center pb-2">
										<LoadingSpinner/>
									</Col>
								}
							</Row>
						</Container>
					</Accordion.Collapse>

					{ props.forceDetails || <Accordion.Toggle
						disabled as={Row}
						eventKey="0"
					>
						<Col className="text-center py-1">
							{
								viewDetails
									? <BsChevronCompactUp color="white" size="30px"/>
									: <BsChevronCompactDown color="white" size="30px"/>
							}
						</Col>
					</Accordion.Toggle>}
				</Accordion>
			</Col>
		</Row>
		{ (token && !timeIsInvalid && !utcStartMoment.isSame(moment(utcMoment))) &&
			<Row className="pb-3 px-3 justify-content-end">
				<Button
					variant="secondary"
				>Save</Button>
			</Row>
		}
	</Container>;
}
