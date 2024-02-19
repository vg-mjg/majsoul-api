import * as React from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import { useDispatch,useSelector } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";

import { dispatchLoggedOutAction } from "../../actions/rigging/LoggedOutAction";
import { IState } from "../../State";
import { RiggingLogin } from "./RiggingLogin";

export function Rigging(): JSX.Element {
	const dispatch = useDispatch();
	const token = useSelector((state: IState) => state.user?.token);

	if (token == null) {
		return <Container className="pt-5">
			<Row className="justify-content-center">
				<Col md="auto">
					<RiggingLogin />
				</Col>
			</Row>
		</Container>;
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
					<Nav.Link onClick={() => dispatchLoggedOutAction(dispatch)}>Logout</Nav.Link>
				</Nav.Item>
			</Nav>
		</Row>
	</Container>;
}
