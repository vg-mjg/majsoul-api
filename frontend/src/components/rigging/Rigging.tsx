import * as React from "react";
import { IState } from "../../State";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import Container from "react-bootstrap/Container";
import { RiggingLogin } from "./RiggingLogin";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { LinkContainer } from 'react-router-bootstrap';
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { useEffect } from "react";
import { buildApiUrl, ActionType, logout } from "../../Actions";
import { Session } from "../Session";
import { Teams } from "../Teams";

function RiggingSessions(props: {}): JSX.Element {
	return null;
	const sessions = useSelector((state: IState) => [], shallowEqual);

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
	const token = useSelector((state: IState) => state.user?.token);
	useEffect(() => {
		fetch(buildApiUrl(`contests/113331`).toString())
			.then(res => res.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest,
			}));

	}, [113331]);

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
					<LinkContainer to="/rigging/teams">
						<Nav.Link>Teams</Nav.Link>
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
					<RiggingSessions/>
				</Route>
				<Route path={`${routeMatch.url}/teams`}>
					<Teams/>
				</Route>
			</Switch>
		</Row>
	</Container>
}
