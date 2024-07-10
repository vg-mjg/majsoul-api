import { stylesheet } from "astroturf";
import type { Rest } from "backend";
import { ContestType } from "backend/dist/store/enums.js";
import clsx from "clsx";
import * as React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Link, useHistory, useLocation } from "react-router-dom";

import { dispatchContestImagesFetchedAction } from "../actions/contests/ContestImagesFetchedAction";
import { dispatchContestSummaryRetrievedAction } from "../actions/contests/ContestSummaryRetrievedAction";
import { dispatchGamesRetrievedAction } from "../actions/games/GamesRetrievedAction";
import { dispatchContestPlayersRetrieved } from "../actions/players/ContestPlayersRetrievedAction";
import { fetchContestImages, fetchContestSummary, fetchPhase } from "../api/Contests";
import { fetchGames } from "../api/Games";
import { fetchContestPlayers } from "../api/Players";
import { IState } from "../State";
import { BracketPlayerStandings } from "./BracketPlayerStandings";
import { ContestContext } from "./contest/ContestProvider";
import { ContestHeader } from "./ContestHeader";
import { ContestMetadataEditor } from "./ContestMetadataEditor";
import { GameResultSummary } from "./GameResultSummary";
import { LeagueStandingChart } from "./league/LeagueStandingChart";
import { PhaseStandings } from "./PhaseStandings";
import { Session } from "./Session";
import { TabNavigator } from "./TabNavigator";
import { Teams } from "./Teams";
import { contestName } from "./utils";
import { LoadingSpinner } from "./utils/LoadingSpinner";
import { RequestState } from "./utils/RequestState";
import { YakumanDisplay } from "./YakumanDisplay";

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
				dispatchContestImagesFetchedAction(dispatch, contest);
			});
		fetchContestSummary(props.contestId).then(contest => {
			setContestRequestState(RequestState.Complete);
			fetchContestPlayers({
				contestId: props.contestId
			}).then(players => dispatchContestPlayersRetrieved(dispatch, props.contestId, players));
			dispatchContestSummaryRetrievedAction(dispatch, contest);
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


	if (imageRequestState !== RequestState.Complete || contestRequestState !== RequestState.Complete) {
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

	return <ContestContext.Provider value={{ contestId: props.contestId }}>
		<Container>
			<ContestHeader contest={contest} />
			<ContestMetadataEditor contestId={contest._id} />
			<PhaseSelector>
				{contest.type === ContestType.League
					? <LeagueContestSummary />
					: <TourneyContestSummary />
				}
			</PhaseSelector>
			<YakumanDisplay contestId={contest._id} />
		</Container>
	</ContestContext.Provider>;
}

const styles = stylesheet`
	.gachaPreview {
		background-color: black;
		flex-wrap: wrap;
		display: flex;
		> img {
			width: 48px;
		}
	}
`;

const TourneyContestSummary: React.FC<PhaseSelectorChildProps> = ({ selectedPhase, hasPhases, phaseRequestState }) => {
	const token = useSelector((state: IState) => state.user?.token);

	const { contestId } = React.useContext(ContestContext);
	const contest = useSelector((state: IState) => state.contestsById[contestId]);

	const games = useSelector((state: IState) => {
		if (state.games == null) {
			return [];
		}

		return Object.values(state.games)
			.filter(game => game.contestId === contestId)
			.sort((a, b) => b.start_time - a.start_time)
			.slice(0, 4);
	});

	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchGames({
			contestIds: [contestId],
			last: 4,
		}).then(games => dispatchGamesRetrievedAction(dispatch, games));
	}, [contestId]);

	if (contest == null) {
		return null;
	}

	return <>
		{token && contest.gacha && <div className={styles.gachaPreview}>
			{contest.gacha.groups.map(group => group.cards).flat()
				.filter(card => card.image)
				.map((card, index) => <img key={card._id} title={`${index}: ${card._id}`} src={card.image} />)}
		</div>}
		<Row className={clsx(hasPhases || "mt-3")}>
			{contest.majsoulFriendlyId === 236728
				? <BracketPlayerStandings contestId={contestId} />
				: <PhaseStandings phase={selectedPhase} isLoading={phaseRequestState !== RequestState.Complete} />
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
	</>;
};

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
	</>;
}

const PhaseSelector: React.FC<React.PropsWithChildren> = ({ children }) => {
	const { contestId } = React.useContext(ContestContext);
	const contest = useSelector((state: IState) => state.contestsById[contestId]);

	const [phaseRequestState, setPhaseRequestState] = React.useState(RequestState.Initial);
	const history = useHistory();
	const hash = parseInt(useLocation().hash.toLowerCase().substr(1));
	const selectedPhaseIndex = Math.max(
		0,
		Math.min(
			(contest.phases?.length ?? 1) - 1,
			Number.isNaN(hash)
				? [...contest.phases ?? []].reverse().find(phase => phase.startTime < Date.now())?.index ?? 0
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
			setSelectedPhase(phase);
		});
	}, [contest.phases, selectedPhaseIndex]);

	const hasPhases = contest?.phases?.length > 1;

	return <>
		{hasPhases &&
			<Row className="mt-3" >
				<Col className="p-0 overflow-hidden rounded-top">
					<TabNavigator
						tabs={contest.phases.map(phase => ({
							key: phase.index.toString(),
							title: phase.name,
						}))}
						onTabChanged={(key) => {
							history.push({
								search: history.location.search,
								hash: `#${key}`,
							});
						}}
						activeTab={selectedPhaseIndex.toString()}
					/>
				</Col>
			</Row>
		}
		{
			React.Children.map(children, child => React.cloneElement(child as React.ReactElement, {
				hasPhases,
				phaseRequestState,
				selectedPhase,
			} as PhaseSelectorChildProps))
		}
	</>;
};

interface PhaseSelectorChildProps {
	hasPhases?: boolean;
	selectedPhase?: Rest.LeaguePhase;
	phaseRequestState?: RequestState;
}

const LeagueContestSummary: React.FC<PhaseSelectorChildProps> = ({
	hasPhases,
	phaseRequestState,
	selectedPhase,
}) => {
	const { contestId } = React.useContext(ContestContext);
	const teams = useSelector((state: IState) => state.contestsById[contestId]?.teams);
	const groups = useSelector((state: IState) => state.contestsById[contestId]?.groups);

	const { search } = useLocation();
	const params = React.useMemo(() => new URLSearchParams(search), [search]);
	const selectedGroup = groups?.find(group => group.name === params.get("group"));

	const sessions = selectedPhase?.sessions ?? [];

	const nextSessionIndex = sessions.findIndex(session => session.scheduledTime > Date.now());
	const nextSession = sessions[nextSessionIndex];
	const currentSession = nextSessionIndex < 0 ? sessions[sessions.length - 1] : sessions[nextSessionIndex - 1];

	const currentSessionGames = useSelector((state: IState) =>
		Object.entries(state.games ?? {})
			.filter(([key, game]) =>
				game.contestId === contestId
				&& game.sessionId === currentSession?._id
			)
	);

	const currentSessionComplete = currentSessionGames.length >= 4;

	const [selectedSessionIndex, setSelectedSessionIndex] = React.useState<number>();

	const onSessionSelect = React.useCallback((index: number) => {
		setSelectedSessionIndex(index - 1);
	}, [setSelectedSessionIndex]);

	const { t } = useTranslation();

	return <>
		<Row className={clsx(!hasPhases && "mt-3" || "rounded-bottom bg-dark")}>
			<Teams
				teamScores={currentSession?.aggregateTotals ?? selectedPhase?.aggregateTotals}
				isLoading={phaseRequestState !== RequestState.Complete}
			/>
		</Row>
		{(!groups || selectedPhase?.showJointGraph || selectedGroup) &&
			<Row className="mt-3">
				<LeagueStandingChart
					phase={selectedPhase}
					teams={Object.values(teams).reduce(
						(total, next) => {
							if (!groups || selectedPhase?.showJointGraph || !!selectedGroup?.teams.find(t => t.id === next._id)) {
								total[next._id] = next;
							}
							return total;
						},
						{}
					)}
					onSessionSelect={onSessionSelect}
				/>
			</Row>
		}
		<SessionSection session={sessions[selectedSessionIndex]} title={t("league.sessions.selected")} />
		<SessionSection session={currentSessionComplete ? null : currentSession} title={t("league.sessions.current")} />
		<SessionSection session={nextSession} title={t("league.sessions.next")} />
		<SessionSection session={currentSessionComplete ? currentSession : null} title={t("league.sessions.recent")} />
		<Row className="mt-4">
			<Col className="text-center">
				<Link className="h5 text-dark" to={`/contests/${contestId}/sessions`}><u>{t("league.sessions.more")}</u></Link>
			</Col>
		</Row>
	</>;
};
