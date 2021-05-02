import { css } from "astroturf";
import clsx from "clsx";
import * as React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Pagination from "react-bootstrap/Pagination";
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

const styles = css`
	@import 'src/bootstrap-vars.sass';

	.pagination {
		display: flex;
		justify-content: center;
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
`;

function SessionsPagination(props: {
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
		{ [...Array(props.numberOfPages).keys()].map(pageNumber =>
			<Pagination.Item
				className={clsx(styles.paginationIcon)}
				key={pageNumber}
				active={pageNumber === (props.activePage ?? activePage) }
				onClick={onChange}
				data-page-number={pageNumber}
			>
				{pageNumber + 1}
			</Pagination.Item>,
		) }
	</Pagination>
}

export function ContestSessions(props: {
	contestId: string;
}): JSX.Element {
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const dispatch = useDispatch();

	const [activePage, setActivePage] = React.useState(0);
	const setActivePageCallback = React.useCallback((selectedPage: number) => {
		setActivePage(selectedPage);
	}, [setActivePage]);

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
		.then(sessions => dispatchContestSessionsRetrievedAction(dispatch, contest._id, sessions));

		fetchContestPlayers({
			contestId: contest._id
		}).then(players => dispatchContestPlayersRetrieved(dispatch, contest._id, players));
	}, [contest?._id]);

	if (contest?.sessionsById == null) {
		return null;
	}

	const sessions = Object.values(contest.sessionsById);
	const numberOfPages = Math.floor(sessions.length / 10) + 1;
	return <Container className="mt-4">
		<Row>
			<Col>
				<SessionsPagination
					numberOfPages={numberOfPages}
					activePage={activePage}
					onActivePageChanged={setActivePageCallback}
				/>
			</Col>
		</Row>
		{sessions.slice(activePage * 10, activePage * 10 + 10).map(session => <Row key={session._id} className="mt-4">
			<Col>
				<Session session={session}/>
			</Col>
		</Row>)}
		<Row className="mt-4">
			<Col>
				<SessionsPagination
					numberOfPages={numberOfPages}
					activePage={activePage}
					onActivePageChanged={setActivePageCallback}
				/>
			</Col>
		</Row>
	</Container>
}
