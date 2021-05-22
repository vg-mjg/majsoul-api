import * as React from "react";
import { findPlayerInformation, IState } from "../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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
import { TextField } from "./utils/TextField";
import { patchSession } from "src/api/Sessions";
import { dispatchSessionPatchedAction } from "src/actions/sessions/ContestSessionsRetrievedAction copy";
import * as dayjs from "dayjs";
import { css } from "astroturf";

enum GamesFetchStatus {
	None,
	Fetching,
	Fetched,
}

enum SessionState {
	Completed,
	Current,
	Future,
}

const styles = css`
	@import 'src/bootstrap-vars.sass';

	.previousSession {
		background-color: $dark;
	}

	.currentSession {
		background-color: $secondary;
	}

	.nextSession {
		background-color: $secondary;
	}
`;

export function Session(props: {
	session: Rest.Session<string>;
	forceDetails?: boolean;
}): JSX.Element {
	const [viewDetails, setViewDetails] = React.useState(false);
	const [gamesFetchedStatus, setGamesFetched] = React.useState(GamesFetchStatus.None);
	const teams = useSelector((state: IState) => state.contestsById[props.session.contestId].teams);
	const detailsOpen = viewDetails || props.forceDetails;

	const token = useSelector((state: IState) => state.user?.token);
	const games = useSelector((state: IState) =>
		Object.values(state.games ?? {})
			.filter(game =>
				game.sessionId === props.session?._id
				&& game.contestId === props.session?.contestId
			)
	);

	const orderedGames = React.useMemo(() => {
		const matchMap: Record<number, number> = [];
		const indexedGames = games.map((game) => {
			const info = findPlayerInformation(game.players[0]._id, teams);
			const matchIndex = props.session.plannedMatches
				.findIndex(match => match.teams.find(team => team._id === info.team._id) != null);

			matchMap[matchIndex] ??= 0;

			return {
				...game,
				matchIndex,
				index: matchMap[matchIndex]++
			}
		});

		const mostGames = Object.entries(matchMap)
			.filter(([key, value]) => key !== "-1")
			.reduce((prev, next) => Math.max(prev, next.length), 0);

		return indexedGames.reduce((total, next, index)=> (
			total[
				next.matchIndex < 0
					? mostGames * 2
					: next.index * 2 + next.matchIndex
			] = next,
			total
		), new Array<Rest.GameResult<string>>(mostGames * 2).fill(null))
	}, [teams, games]);

	const dispatch = useDispatch();

	React.useEffect(() => {
		setGamesFetched(GamesFetchStatus.None);
	}, [props.session?._id]);

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
	}, [props.session?._id, detailsOpen, gamesFetchedStatus]);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setViewDetails(accordionKey === "0");
	}, [setViewDetails]);

	const utcScheduledTime = React.useMemo(() => {
		if (props.session?.scheduledTime == null) {
			return dayjs().tz("UTC");
		}
		return dayjs(props.session.scheduledTime).tz("UTC");
	}, [props.session?.scheduledTime]);

	const utcStartMomentText = React.useMemo(() => utcScheduledTime.format("LT l z"), [utcScheduledTime]);
	const hasStarted = React.useMemo(() => utcScheduledTime.isBefore(dayjs().tz("UTC")), [utcScheduledTime]);

	const [name, setName] = React.useState<string>();
	const [utcMoment, setUtcMoment] = React.useState<string>();
	const [timeIsInvalid, setTimeIsValid] = React.useState(!utcScheduledTime.isValid());
	const [editTime, setEditTime] = React.useState(false);

	if (props.session == null) {
		return null;
	}

	const sessionState =
		hasStarted
			? gamesFetchedStatus === GamesFetchStatus.Fetched && games.length === 0
				? SessionState.Current
				: SessionState.Completed
			: SessionState.Future

	return <Container
		fluid
		className={clsx(
			"rounded text-light",
			sessionState === SessionState.Future
				? styles.nextSession
				: sessionState === SessionState.Completed
					? styles.previousSession
					: styles.currentSession
		)}
	>
		<Row className="py-3 px-2">
			<Col md="auto">
				<Container>
					<Row>
						<Form.Control
							plaintext={!token || !editTime}
							readOnly={!token || !editTime}
							isInvalid={timeIsInvalid}
							className={`py-0${(!token || !editTime) ? " text-light" : ""}`}
							value={`${utcMoment ?? utcStartMomentText}`}
							onChange={event => {
								setUtcMoment(event.target.value)
								setTimeIsValid(!dayjs(event.target.value).isValid())
							}}
							onFocus={(event: any) => setEditTime(true)}
							onBlur={(event: any) => {
								if (timeIsInvalid) {
									setUtcMoment(null)
								} else {
									setUtcMoment(dayjs(event.target.value).tz("UTC").format("LT l z"))
								}
								setEditTime(false);
							}}
						/>
					</Row>
					<Row>
						{dayjs(props.session.scheduledTime).calendar()} in {dayjs.tz.guess()}
					</Row>
				</Container>
			</Col>
			<Col className="text-right align-self-center">
				<CountdownTimer targetTime={props.session.scheduledTime} prefix={props.session.name}></CountdownTimer>
			</Col>
		</Row>
		<Row>
			<Col>
				<Accordion
					as={Container}
					className="p-0"
					onSelect={onAccordionSelect}
					activeKey={detailsOpen ? "0" : null}
				>
					<Accordion.Collapse eventKey="0">
						<Container className="p-0 pb-2">
							{ detailsOpen && <>
								{ props.session.plannedMatches?.length > 0 && <>
									<Row className="no-gutters">
										<Col className="px-2">
											<div className="h5"><u>Matches</u></div>
										</Col>
									</Row>
									<Row className="no-gutters">
										{props.session.plannedMatches.map((match, index) => <Col key={index}>
											<Match match={match} contestId={props.session.contestId} totals={hasStarted ? props.session.totals : null} aggregateTotals={props.session.aggregateTotals}/>
										</Col>)}
									</Row>
								</>}
								{ hasStarted && <>
									<Row className="no-gutters">
										<Col className="px-2">
											<div className="h5"><u>Games</u></div>
										</Col>
									</Row>
									<Row className="no-gutters">
										{ gamesFetchedStatus === GamesFetchStatus.Fetched
											? games.length === 0
												? <Col className="text-center">
													<div className={clsx("h4 font-weight-bold m-0", props.forceDetails ? "pb-4" : "pb-1")}>未だ無し</div>
												</Col>
												: orderedGames.map((game, index) => <React.Fragment key={index}>
													{ game == null
														? <Col style={{minWidth: "auto"}} className="d-flex align-items-stretch">
															<div
																className={clsx(
																	"mt-5 mx-2 mb-3 rounded d-flex align-items-center justify-content-center",
																	sessionState === SessionState.Completed
																		? "bg-secondary"
																		: "bg-dark"
																)}
																style={{flex: 1}}
															>
																<div className="h4 font-weight-bold m-0">
																	試合未決
																</div>
															</div>
														</Col>
														: <Col style={{minWidth: "auto"}}>
															<GameResultSummary game={game}/>
														</Col>
													}
													{(index % 2 == 1) && <div className="w-100"/>}
												</React.Fragment>)
											: <Col className="text-center pb-2">
												<LoadingSpinner/>
											</Col>
										}
									</Row>
								</>}
							</>}
						</Container>
					</Accordion.Collapse>

					{ props.forceDetails || <Accordion.Toggle
						disabled as={Row}
						eventKey="0"
					>
						<Col className="text-center pb-1">
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
		{ token &&
			<Row className="pb-3 px-3 justify-content-end">
				<Col>
				<TextField
					id={`${props.session._id}-name-editor`}
					fallbackValue={name ?? props.session.name}
					placeholder="Session Name"
					onChange={(oldValue, newValue) => {
						setName(newValue);
					}}
				/>
			</Col>
				<Col md="auto">
					<Button
						disabled={
							(utcMoment == null || timeIsInvalid)
							&& (name === props.session.name || name === undefined)
						}
						variant="secondary"
						onClick={() => patchSession(token, {
							_id: props.session._id,
							name,
							scheduledTime: dayjs(utcMoment ?? utcStartMomentText).valueOf()
						}).then(session => dispatchSessionPatchedAction(dispatch, session))}
					>Save</Button>
				</Col>
			</Row>
		}
	</Container>;
}
