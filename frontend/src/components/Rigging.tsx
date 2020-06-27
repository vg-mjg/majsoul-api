import * as React from "react";
import { IState, ContestTeam } from "../State";
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import Container from "react-bootstrap/Container";
import { RiggingLogin } from "./RiggingLogin";
import Nav from "react-bootstrap/Nav";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { LinkContainer } from 'react-router-bootstrap';
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { useEffect } from "react";
import { buildApiUrl, ActionType, logout, patchTeam } from "../Actions";
import { Session } from "./Session";
import defaultImage from "../../assets/hatsu.png";
import Button from "react-bootstrap/Button";

function RiggingSessions(props: {}): JSX.Element {
	const sessions = useSelector((state: IState) => state.contest?.sessions, shallowEqual);

	if (!sessions) {
		return null;
	}

	return <Container>
		{sessions.map(session => <Row key={session._id} className="mt-2">
			<Session session={session}/>
		</Row>)}
	</Container>
}

function Team(props: {team: ContestTeam}): JSX.Element {
	const user = useSelector((state: IState) => state.user);
	const [image, setImage] = React.useState(props.team.image ?? defaultImage);
	const dispatch = useDispatch();
	return <Container className="p-0">
		<Row className="no-gutters align-items-center">
			<Col md="auto" className="mr-2">
				<label
					className="rounded"
					style={{
						display: "block",
						margin: 0,
						height: 64,
						width: 64,
						backgroundImage: `url(${image})`,
						backgroundRepeat: "no-repeat",
						backgroundPosition: "center",
						backgroundSize: "contain"
					}}
				>
					<input disabled={user?.token == null} style={{display: "none"}} type="file" onChange={function (event){
						const reader = new FileReader();
						const input = event.target as HTMLInputElement;
						if (input.files && input.files[0]) {
							reader.onload = function(e) {
								setImage(e.target.result);
							}
							reader.readAsDataURL(input.files[0]);
						}
					}}/>
				</label>
			</Col>
			<Col md="auto">
				<h5 >
					<b className="text-capitalize">
						{props.team.name.toLocaleLowerCase()}
					</b>
				</h5>
			</Col>
			<Col></Col>
			<Col md="auto">
				{ (props.team.image !== image && image !== defaultImage) &&
					<Button
						variant="secondary"
						onClick={(event: any) => {patchTeam(dispatch, user.token, {image: image, _id: props.team._id} as ContestTeam)}}
					>Save</Button>
				}
			</Col>
		</Row>
	</Container>
}

function Teams(props: {}): JSX.Element {
	const teams = useSelector((state: IState) => state?.contest?.teams);
	if (!teams) {
		return null;
	}

	return <Container className="rounded bg-dark text-light px-2 pb-2">
		{Object.values(teams).map((team, index) =>
			<Row key={index} className="mt-2 no-gutters">
				<Team team={team} />
			</Row>
		)}
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
