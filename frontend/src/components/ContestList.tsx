import * as React from "react";
import { fetchContests } from "../Actions";
import { IState } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { Link } from "react-router-dom";

export function ContestList(): JSX.Element {
	const dispatch = useDispatch();
	React.useEffect(() => {
		fetchContests(dispatch);
	}, [true]);
	const contests = useSelector((state: IState) => Object.values(state.contestsById));
	return <Container>
		{contests.map(contest => <Row className="bg-dark rounded text-white" key={contest._id}>
			<Link to={`/contests/${contest._id}`}>
				<h4>{contest.name}</h4>
			</Link>
		</Row>
		)}
	</Container>;
}
