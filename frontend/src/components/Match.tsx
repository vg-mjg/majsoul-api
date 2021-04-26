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
	return <Container
		className={`font-weight-bold p-0 rounded bg-primary text-dark`}
		style={{
			border: `3px solid #${props.team.color ?? 'fff'}`
		}}
	>
		<Row className={`no-gutters`} style={{lineHeight: "40px", textAlign: "center"}}>
			<Col
				md="auto"
				className={`rounded-left`}
				style={{minWidth: "40px", boxSizing: "content-box"}}
			>
				<div className="rounded "style={{
						height: 40,
						width: 40,
						backgroundImage: `url(${props?.team?.image})`,
						backgroundRepeat: "no-repeat",
						backgroundPosition: "center",
						backgroundSize: "contain"
					}}/>
			</Col>
			<Col
				className="px-2"
			>
				<div
					className="text-capitalize"
					style={{
						lineHeight: "40px",
						overflow: "hidden",
						whiteSpace: "nowrap",
						textOverflow: "ellipsis",
					}}
				>
					{props.team.name?.toLowerCase()}
				</div>
			</Col>
			<Col md="auto" style={{minWidth: "4rem"}} className="rounded-right">
				{props.score / 1000}
			</Col>
		</Row>
	</Container>;
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

	const cellStyle = "mb-1 pl-0 pr-1";
	const rowStyle = "pl-1 no-gutters";
	return <Container className="px-1 py-2">
		{teamsArray.map(team =>
			<Row key={team._id} className={rowStyle}>
				<Col className={cellStyle}>
				<Team team={team} score={props.totals[team._id]}></Team>
				</Col>
			</Row>
		)}
	</Container>;
}
