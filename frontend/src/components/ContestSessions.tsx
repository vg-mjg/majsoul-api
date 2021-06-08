import { css } from "astroturf";
import clsx from "clsx";
import { Rest } from "majsoul-api";
import * as React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Pagination from "react-bootstrap/Pagination";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Link, useHistory, useLocation } from "react-router-dom";
import { dispatchContestImagesFetchedAction } from "src/actions/contests/ContestImagesFetchedAction";
import { dispatchContestSummaryRetrievedAction } from "src/actions/contests/ContestSummaryRetrievedAction";
import { dispatchContestPlayersRetrieved } from "src/actions/players/ContestPlayersRetrievedAction";
import { dispatchContestSessionsRetrievedAction } from "src/actions/sessions/ContestSessionsRetrievedAction";
import { fetchContestImages, fetchContestSummary } from "src/api/Contests";
import { fetchContestPlayers } from "src/api/Players";
import { fetchContestSessions } from "src/api/Sessions";
import { IState } from "../State";
import { ContestHeader } from "./ContestHeader";
import { Session } from "./Session";
import { contestName } from "./utils";

const styles = css`
	@import 'src/bootstrap-vars.sass';

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 0;
	}

	.paginationIcon {
		&:global(.active) {
			:global(.page-link) {
				background-color: $light;
				color: $dark;
				border-color: $dark;
			}
		}

		:global(.page-link) {
			background-color: $dark;
		}
	}

	.spacer {
		flex: 1;
	}

	.backLink {
		color: $dark;
	}
`;

function SessionsPagination(props: {
	contestId: string;
	numberOfPages: number;
	activePage?: number;
	onActivePageChanged?: (page: number) => void;
}) {
	const [activePage, setActivePage] = React.useState(0);

	const onChange = React.useCallback((event: any) => {
		const pageNumber = parseInt(event.currentTarget.getAttribute("data-page-number"));
		setActivePage(pageNumber);

		if (props.onActivePageChanged == null) {
			return;
		}
		props.onActivePageChanged(pageNumber);
	}, [props.onActivePageChanged])

	return <Pagination className={styles.pagination}>
		<Link className={styles.backLink} to={`/contests/${props.contestId}/`}>
			Back to Summary
		</Link>
		<div className={styles.spacer} />
		{[...Array(props.numberOfPages).keys()].map(pageNumber =>
			<Pagination.Item
				className={clsx(styles.paginationIcon)}
				key={pageNumber}
				active={pageNumber === (props.activePage ?? activePage)}
				onClick={onChange}
				data-page-number={pageNumber}
			>
				{pageNumber + 1}
			</Pagination.Item>,
		)}
	</Pagination>
}

export function ContestSessions(props: {
	contestId: string;
}): JSX.Element {
	const history = useHistory();
	const hash = useLocation().hash.toLowerCase().substr(1);

	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const dispatch = useDispatch();

	const setActivePageCallback = React.useCallback((selectedPage: number) => {
		history.push({
			hash: `#${selectedPage + 1}`,
		});
	}, [history]);

	React.useEffect(() => {
		fetchContestImages(props.contestId)
			.then(contest => dispatchContestImagesFetchedAction(dispatch, contest));
		fetchContestSummary(props.contestId)
			.then(contest => dispatchContestSummaryRetrievedAction(dispatch, contest));
	}, [props.contestId]);

	React.useEffect(() => {
		if (contest?._id == null) {
			return;
		}

		fetchContestSessions(contest._id)
			.then(phases => dispatchContestSessionsRetrievedAction(
				dispatch,
				contest._id,
				phases
			));

		fetchContestPlayers({
			contestId: contest._id
		}).then(players => dispatchContestPlayersRetrieved(dispatch, contest._id, players));
	}, [contest?._id]);

	const { t, i18n } = useTranslation();

	React.useEffect(() => {
		if (contest?.name == null) {
			document.title = t("title.contest.sessions.generic");
			return;
		}

		document.title = t("title.contest.sessions.specific", { title: contestName(contest) });
	}, [contest?.name, i18n.language]);

	if (contest?.sessionsById == null) {
		return null;
	}

	const sessions = Object.values(contest.sessionsById).sort((a, b) => a.scheduledTime - b.scheduledTime);
	const parsedHash = parseInt(hash) ?? 0;
	const now = Date.now();
	const activePage = isNaN(parsedHash) ? Math.floor(sessions.findIndex(session => session.scheduledTime >= now) / 10) : parsedHash - 1;

	const numberOfPages = Math.floor(sessions.length / 10) + 1;
	return <Container className="mt-4">
		<ContestHeader contest={contest} />
		<Row className="mt-2">
			<Col>
				<SessionsPagination
					contestId={props.contestId}
					numberOfPages={numberOfPages}
					activePage={activePage}
					onActivePageChanged={setActivePageCallback}
				/>
			</Col>
		</Row>
		{sessions.slice(activePage * 10, activePage * 10 + 10).map(session => <Row key={session._id} className="mt-4">
			<Col>
				<Session session={session} />
			</Col>
		</Row>)}
		<Row className="mt-4 mb-2">
			<Col>
				<SessionsPagination
					contestId={props.contestId}
					numberOfPages={numberOfPages}
					activePage={activePage}
					onActivePageChanged={setActivePageCallback}
				/>
			</Col>
		</Row>
	</Container>
}
