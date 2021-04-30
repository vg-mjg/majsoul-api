import * as React from "react";
import { IState } from "../State";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useSelector } from "react-redux";
import { css } from "astroturf";
import clsx from "clsx";
import { TeamImage } from "./TeamImage";


const styles = css`
	.teamScoreWide {
		min-width: 6.5rem;
	}

	.teamScore {
		min-width: 3.5rem;
	}

	.nameContainer {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
	}

	.teamName {
		flex-grow: 0;
		flex-basis: auto;
		display: inline-block;
		min-width: auto;
		max-width: 100%;
		line-height: initial;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
`;

function Team(props : {
	team: Store.ContestTeam,
	score?: number,
	totalScore?: number,
}): JSX.Element {
	return <Container
		className={`font-weight-bold p-0 rounded bg-primary text-dark border border-2`}
	>
		<Row className={`no-gutters`} style={{lineHeight: "40px", textAlign: "center"}}>
			<Col
				md="auto"
				className={`rounded-left`}
				style={{minWidth: "40px", boxSizing: "content-box"}}
			>
				<TeamImage team={props.team}/>
			</Col>
			<Col
				className={clsx("px-2", styles.nameContainer)}
				style={{
					position: "relative",
					lineHeight: "40px",
				}}
			>
				<div
					className={clsx("text-capitalize", styles.teamName)}
					style={{
						borderBottom: `3px solid #${props.team.color ?? 'fff'}`
					}}
				>
					{props.team.name}
				</div>
			</Col>
			{ props.totalScore != null &&
				<Col md="auto" className={clsx("rounded-right text-right pr-1", props.score == null ? styles.teamScore : styles.teamScoreWide)}>
					{`${props.totalScore / 1000}${props.score == null ? "" : `(${props.score > 0 ? "+" : ""}${props.score / 1000})`}`}
				</Col>
			}
		</Row>
	</Container>;
}


export function Match(props: {
	match: Store.Match,
	totals?: Record<string, number>,
	aggregateTotals: Record<string, number>,
	contestId: string,
}): JSX.Element {
	const teams = useSelector((state: IState) => state.contestsById[props.contestId].teams);
	if (teams == null) {
		return null;
	}

	const totals = props.totals ?? {};

	const teamsArray = props.match.teams.map(team => teams[team._id]).sort((a, b) => props.aggregateTotals[b._id] - props.aggregateTotals[a._id]);

	const cellStyle = "mb-1 pl-0 pr-1";
	const rowStyle = "pl-1 no-gutters";
	return <Container className="px-1 py-2">
		{teamsArray.map(team =>
			<Row key={team._id} className={rowStyle}>
				<Col className={cellStyle}>
				<Team team={team} score={totals[team._id]} totalScore={props.aggregateTotals[team._id]}></Team>
				</Col>
			</Row>
		)}
	</Container>;
}
