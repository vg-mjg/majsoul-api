import * as React from "react";
import { Line } from "../utils/Chart";
import { defaults, ChartData } from "chart.js";
import { Store, Rest } from "majsoul-api";
import { IState, Contest } from "../../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { useSelector } from "react-redux";
import * as dayjs from 'dayjs';

defaults.color = "white";
defaults.borderColor = "#666666";

function createData(sessions: Rest.Session[], teams: Record<string, Store.ContestTeam>): ChartData {
	return {
		labels: ["Start"].concat(sessions.map(session => {
			if (session.name) {
				return session.name;
			}
			const time =  dayjs(session.scheduledTime).tz('UTC');
			return `${time.hour() === 18 ? 'EU' : 'US'} ${time.format('D/M')}`
		})),

		datasets: Object.values(teams ?? {}).map(team => {
			const color = `#${team.color ?? "000"}`;
			return {
				label: team.name,
				fill: false,
				lineTension: 0.1,
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: color,
				pointBackgroundColor: color,
				backgroundColor: color,
				borderColor: color,
				pointHoverBackgroundColor: color,
				pointHoverBorderColor: color,
				pointBorderWidth: 1,
				pointHoverRadius: 4,
				pointHoverBorderWidth: 2,
				pointRadius: 3,
				pointHitRadius: 10,
				data: [0].concat(sessions.map(session => session.aggregateTotals[team._id] / 1000)),
				// yAxisID: "uma",
				// xAxisID: "sessions",
			}
		})
	}
}

// private onClick(event?: MouseEvent, activeElements?: {}[]) {
// 	console.log(event, activeElements);
// }

// private onElementsClick(e: any){
// 	console.log(e);
// }

export function LeagueStandingChart(props: {
	contest: Contest;
}): JSX.Element {
	if (props.contest?.sessionsById == null) {
		return null;
	}

	const sessions = useSelector((state: IState) => {
		const now = Date.now();
		if (props.contest.sessionsById == null) {
			return [];
		}
		return Object.values(props.contest.sessionsById).filter(session => session.scheduledTime < now);
	});

	const teams = useSelector((state: IState) => props.contest?.teams);

	return <Container className="bg-dark rounded text-white">
		<Row className="px-2 pb-3 pt-4">
			<Line
				data={createData(sessions, teams)}
				options={{
					// onClick: this.onClick,
					scales: {
						y: {
							// id: "uma",
							position: "right",
							// gridLines: {
							// 	color: "#666666",
							// 	zeroLineColor: "#666666"
							// }
						},
						x: {
								// id: "sessions",
							grid: {
								display: false
							}
						},
					},
					plugins: {
						legend: {
							display: false
						}
					}
				}}
				// onElementsClick={this.onElementsClick}
			></Line>
		</Row>
	</Container>
}
