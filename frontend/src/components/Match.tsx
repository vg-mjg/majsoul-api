import * as React from "react";
import { IState } from "../State";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import defaultImage from "../../assets/hatsu.png";
import Col from 'react-bootstrap/Col';
import { useSelector } from "react-redux";

function Team(props : {
	team: Store.ContestTeam,
	score?: number,
}): JSX.Element {
	return <Container className="p-0">
		<Row className={"align-items-center flex-nowrap"}>
			<Col md="auto" className="mr-3">
				<label
					className="rounded"
					style={{
						display: "block",
						margin: 0,
						height: 64,
						width: 64,
						backgroundImage: `url(${props.team.image ?? defaultImage})`,
						backgroundRepeat: "no-repeat",
						backgroundPosition: "center",
						backgroundSize: "contain"
					}}
				/>
			</Col>
			<Col md="auto" className="text-nowrap" style={{flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis"}}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold text-capitalize h5 text-truncate" style={{borderBottom: `3px solid #${props.team.color}`}}>
							{props.team.name?.toLocaleLowerCase() ?? `#${props.team._id}`}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col></Col>
			{ isNaN(props.score) || <Col md="auto" className="ml-3"> <h5><b>{props.score / 1000}</b></h5></Col> }
		</Row>
	</Container>
}

export function Match(props: {
	match: Store.Match,
	totals: Record<string, number>,
	contestId: string,
}): JSX.Element {
	const teams = useSelector((state: IState) => state.contestsById[props.contestId].teams);
	if (teams == null) {
		return null;
	}

	const teamsArray = props.match.teams.map(team => teams[team._id]).sort((a, b) => props.totals[b._id] - props.totals[a._id]);
	return <Container className="bg-primary pt-2 rounded text-dark">
		{teamsArray.map(team =>
			<Row key={team._id} className="pl-1 no-gutters">
				<Col className="mb-2 pl-0 pr-1">
					<Team team={team} score={props.totals[team._id]}></Team>
				</Col>
			</Row>
		)}
	</Container>;
}
