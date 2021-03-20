import * as React from "react";
import { fetchContests, putContest } from "../Actions";
import { IState } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import { useCallback } from "react";

export function ContestList(): JSX.Element {
	const dispatch = useDispatch();
	const token = useSelector((state: IState) => state.user?.token);
	const addContestFunc = useCallback(() => putContest(dispatch, token), [dispatch, token]);

	React.useEffect(() => {
		fetchContests(dispatch);
	}, [true]);
	const contests = useSelector((state: IState) => Object.values(state.contestsById));
	return <Container>
		{contests.map(contest => <Row className="bg-dark rounded text-white pt-2 pb-1 my-2" key={contest._id}>
			<Link to={`/contests/${contest._id}`}>
				<Col>
					<h4>{contest.displayName ?? contest.name ?? `#${contest._id}`}</h4>
				</Col>
				{/* <Col></Col> */}
			</Link>
		</Row>
		)}
		{token && <Row className="text-right">
			<Col>
				<Button variant="dark" onClick={addContestFunc}>
					Add Contest
				</Button>
			</Col>
		</Row>}
	</Container>;
}
