import * as React from "react";
import { IState } from "../State";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import Container from "react-bootstrap/Container";
import { RiggingLogin } from "./RiggingLogin";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { LinkContainer } from 'react-router-bootstrap';
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { useEffect } from "react";
import { buildApiUrl, ActionType, logout } from "../Actions";
import { Session } from "./Session";

function RiggingSessions(props: {contestId: string}): JSX.Element {
	const sessions = useSelector((state: IState) => state.contest?.sessions, shallowEqual);
	const dispatch = useDispatch();
	useEffect(() => {
		fetch(buildApiUrl(`contests/${props.contestId}`).toString())
			.then(res => res.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest,
			}));

	}, [props.contestId]);

	if (!sessions) {
		return null;
	}

	return <Container>
		{sessions.map(session => <Row key={session._id} className="mt-2">
			<Session session={session}/>
		</Row>)}
	</Container>
}

export function Rigging(): JSX.Element {
	const routeMatch = useRouteMatch();
	const dispatch = useDispatch();
	const token = useSelector<IState, string>((state) => state.user?.token);

	if (token == null) {
		return <Container className="pt-5">
			<Row className="justify-content-center">
				<Col md="auto">
					<RiggingLogin />
				</Col>
			</Row>
		</Container>
	}

	return <Container>
		<Row>
			<Nav className="bg-dark" activeKey="/rigging/sessions">
				<Nav.Item>
					<LinkContainer to="/rigging/sessions">
						<Nav.Link>Sessions</Nav.Link>
					</LinkContainer>
				</Nav.Item>
				<Nav.Item>
					<Nav.Link onClick={() => logout(dispatch)}>Logout</Nav.Link>
				</Nav.Item>
			</Nav>
		</Row>
		<Row>
			<Switch>
				<Route path={`${routeMatch.url}/sessions`}>
					<RiggingSessions contestId={"113331"}/>
				</Route>
			</Switch>
		</Row>
	</Container>
}
