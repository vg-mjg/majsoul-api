import * as React from "react";
import { LeagueStandingChart } from "./league/LeagueStandingChart";
import { IState, Contest } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Session } from "./Session";
import { Teams } from "./Teams";
import { GameResultSummary } from "./GameResultSummary";
import { ContestType, TourneyContestType } from "majsoul-api/dist/store/types/types";
import { ContestMetadataEditor } from "./ContestMetadataEditor";
import { PlayerStandings } from "./PlayerStandings";
import { YakumanDisplay } from "./YakumanDisplay";
import { BracketPlayerStandings } from "./BracketPlayerStandings";
import { contestName } from "./utils";
import { fetchGames } from "src/api/Games";
import { dispatchGamesRetrievedAction } from "src/actions/games/GamesRetrievedAction";
import { fetchContestPlayers } from "src/api/Players";
import { dispatchContestPlayersRetrieved } from "src/actions/players/ContestPlayersRetrievedAction";
import { fetchContestImages, fetchContestSummary, fetchActivePhase, fetchPhase } from "src/api/Contests";
import { dispatchContestSummaryRetrievedAction } from "src/actions/contests/ContestSummaryRetrievedAction";
import { Link, useHistory, useLocation } from "react-router-dom";
import { dispatchContestImagesFetchedAction } from "src/actions/contests/ContestImagesFetchedAction";
import { Rest } from "majsoul-api";
import { ContestHeader } from "./ContestHeader";
import { TabNavigator } from "./TabNavigator";
import { RequestState } from "./utils/RequestState";
import { LoadingSpinner } from "./utils/LoadingSpinner";
import { useTranslation } from "react-i18next";
import { PhaseStandings } from "./PhaseStandings";
import { ContestContext } from "./Contest/ContestProvider";

export function ContestSummary(props: {
	contestId: string;
}): JSX.Element {
	const [imageRequestState, setImageRequestState] = React.useState(RequestState.Initial);
	const [contestRequestState, setContestRequestState] = React.useState(RequestState.Initial);
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const dispatch = useDispatch();

	React.useEffect(() => {
		if (!props.contestId) {
			return;
		}

		setImageRequestState(RequestState.Started);
		setContestRequestState(RequestState.Started);

		fetchContestImages(props.contestId)
			.then(contest => {
				setImageRequestState(RequestState.Complete);
				dispatchContestImagesFetchedAction(dispatch, contest)
			});
		fetchContestSummary(props.contestId).then(contest => {
			setContestRequestState(RequestState.Complete);
			fetchContestPlayers({
				contestId: props.contestId
			}).then(players => dispatchContestPlayersRetrieved(dispatch, props.contestId, players));
			dispatchContestSummaryRetrievedAction(dispatch, contest)
		});
	}, [props.contestId]);

	const { t, i18n } = useTranslation();

	React.useEffect(() => {
		if (contest?.name == null) {
			document.title = t("title.contest.page.generic");
			return;
		}

		document.title = t("title.contest.page.specific", { title: contestName(contest) });
	}, [contest?.name, i18n.language]);


	if (imageRequestState !== RequestState.Complete && contestRequestState !== RequestState.Complete) {
		return <Container className="text-center pt-4">
			<LoadingSpinner color="black" />
		</Container>;
	}

	if (contest == null) {
		return <Container className="text-light text-center pt-4">
			<h5 className="bg-dark rounded py-3">
				Tourney #{props.contestId} doesn&apos;t exist.
			</h5>
		</Container>;
	}

	return <ContestContext.Provider value={{contestId: props.contestId}}>
		<Container>
			<ContestHeader contest={contest} />
			<ContestMetadataEditor contestId={contest._id} />
			{contest.type === ContestType.League
				? <LeagueContestSummary contest={contest} />
				: <TourneyContestSummary contestId={contest._id} />
			}
			<YakumanDisplay contestId={contest._id} />
		</Container>
	</ContestContext.Provider>
}

function TourneyContestSummary(props: { contestId: string }): JSX.Element {
	const token = useSelector((state: IState) => state.user?.token);
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

	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchGames({
			contestIds: [props.contestId],
			last: 4,
		}).then(games => dispatchGamesRetrievedAction(dispatch, games));
	}, [props.contestId]);

	if (contest == null) {
		return null;
	}

	return <>
		<Row className="mt-3">
			{contest.majsoulFriendlyId === 236728
				? <BracketPlayerStandings contestId={props.contestId} />
				: contest.tourneyType === TourneyContestType.Cumulative || contest.tourneyType == null
					? <PlayerStandings contestId={props.contestId} />
					: <PhaseStandings />
			}
		</Row>
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Recent Games</u></Col>
		</Row>
		<Row>
			<Container className="p-0 rounded bg-dark text-light px-1 py-2">
				<Row className="no-gutters">
					{games?.filter(game => token || !game.hidden).map((game, index) => <React.Fragment key={game._id}>
						<Col style={{ minWidth: "auto" }}>
							<GameResultSummary game={game} />
						</Col>
						{(index % 2 == 1) && <div className="w-100" />}
					</React.Fragment>)}
				</Row>
			</Container>
		</Row>
	</>
}

function SessionSection(props: {
	session: Rest.Session<string>;
	title: string;
}): JSX.Element {
	if (!props.session) {
		return null;
	}

	return <>
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>{props.title}</u></Col>
		</Row>
		<Row>
			<Session session={props.session} forceDetails />
		</Row>
	</>
}

function LeagueContestSummary({ contest }: { contest: Contest }): JSX.Element {
	const [phaseRequestState, setPhaseRequestState] = React.useState(RequestState.Initial);
	const history = useHistory();
	const hash = parseInt(useLocation().hash.toLowerCase().substr(1));
	const selectedPhaseIndex = Math.max(
		0,
		Math.min(
			(contest.phases?.length ?? 1) - 1,
			Number.isNaN(hash)
				? [...contest.phases ?? []].reverse().find(phase => phase.startTime < Date.now()).index ?? 0
				: hash
		)
	);

	const [selectedPhase, setSelectedPhase] = React.useState<Rest.LeaguePhase>();

	React.useEffect(() => {
		if (!contest.phases) {
			return;
		}
		setPhaseRequestState(RequestState.Started);
		fetchPhase(contest._id, selectedPhaseIndex).then(phase => {
			setPhaseRequestState(RequestState.Complete);
			setSelectedPhase(phase)
		});
	}, [contest.phases, selectedPhaseIndex]);

	const sessions = selectedPhase?.sessions ?? [];

	const nextSessionIndex = sessions.findIndex(session => session.scheduledTime > Date.now());
	const nextSession = sessions[nextSessionIndex];
	const currentSession = nextSessionIndex < 0 ? sessions[sessions.length - 1] : sessions[nextSessionIndex - 1];

	const currentSessionGames = useSelector((state: IState) =>
		Object.entries(state.games ?? {})
			.filter(([key, game]) =>
				game.contestId === contest?._id
				&& game.sessionId === currentSession?._id
			)
	);

	const currentSessionComplete = currentSessionGames.length >= 4;

	const [selectedSessionIndex, setSelectedSessionIndex] = React.useState<number>();

	const onSessionSelect = React.useCallback((index: number) => {
		setSelectedSessionIndex(index - 1)
	}, [setSelectedSessionIndex]);

	const { t } = useTranslation();

	return <>
		{contest.phases && contest.phases.length > 1 &&
			<Row>
				<Col className="p-0 overflow-hidden rounded">
					<TabNavigator
						tabs={contest.phases.map(phase => ({
							key: phase.index.toString(),
							title: phase.name,
						}))}
						onTabChanged={(key) => {
							history.push({
								hash: `#${key}`,
							});
						}}
						activeTab={selectedPhaseIndex.toString()}
					/>
				</Col>
			</Row>
		}
		<Row className="mt-3">
			<Teams
				contestId={contest._id}
				teams={contest.teams}
				teamScores={currentSession?.aggregateTotals ?? selectedPhase?.aggregateTotals}
				isLoading={phaseRequestState !== RequestState.Complete}
			/>
		</Row>
		<Row className="mt-3">
			<LeagueStandingChart phase={selectedPhase} teams={contest.teams} onSessionSelect={onSessionSelect} />
		</Row>
		<SessionSection session={sessions[selectedSessionIndex]} title={t("league.sessions.selected")} />
		<SessionSection session={currentSessionComplete ? null : currentSession} title={t("league.sessions.current")} />
		<SessionSection session={nextSession} title={t("league.sessions.next")} />
		<SessionSection session={currentSessionComplete ? currentSession : null} title={t("league.sessions.recent")} />
		<Row className="mt-4">
			<Col className="text-center">
				<Link className="h5 text-dark" to={`/contests/${contest._id}/sessions`}><u>{t("league.sessions.more")}</u></Link>
			</Col>
		</Row>
	</>
}
