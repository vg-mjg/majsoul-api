import * as React from "react";
import { Line } from "../utils/Chart";
import { defaults, ChartData } from "chart.js";
import { Store, Rest } from "majsoul-api";
import { Contest } from "../../State";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import * as dayjs from 'dayjs';

defaults.color = "white";
defaults.borderColor = "#666666";

function createData(phase: Rest.Phase, sessions: Rest.Session[], teams: Record<string, Store.ContestTeam>): ChartData {
	return {
		labels: ["Start"].concat(sessions.map(session => {
			if (session.name) {
				return session.name;
			}
			const time = dayjs(session.scheduledTime).tz('UTC');
			return `${time.hour() === 18 ? 'EU' : 'US'} ${time.format('D/M')}`
		})),

		datasets: Object.values(teams ?? {}).map(team => {
			const color = `#${team.color ?? "000"}`;
			return {
				label: team.name,
				lineTension: 0.1,
				backgroundColor: color,
				borderColor: color,
				data: [(phase.aggregateTotals[team._id] ?? 0) / 1000].concat(sessions.map(session => session.aggregateTotals[team._id] / 1000)),
				yAxisID: "y",
			}
		})
	}
}

export function LeagueStandingChart(props: {
	contest: Contest;
	onSessionSelect?: (index: number) => void;
}): JSX.Element {
	if (props.contest?.phases == null) {
		return null;
	}

	const now = Date.now();

	const activePhase = [...props.contest.phases]
		.sort((a, b) => b.startTime - a.startTime)
		.find(phase => phase.startTime < Date.now());

	const sessions = activePhase?.sessions?.filter(session => session.scheduledTime < now);

	const teams = props.contest?.teams;

	return <Container className="bg-dark rounded text-white">
		<Row className="px-2 pb-3 pt-4">
			<Line
				data={createData(activePhase, sessions, teams)}
				options={{
					animation: {
						duration: 0
					},
					// onClick: this.onClick,
					interaction: {
						mode: "nearest",
						intersect: false,
					},
					scales: {
						y: {
							position: "right",
						},
						x: {
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
				getElementAtEvent={(element) =>
					props.onSessionSelect
					&& element != null
					&& props.onSessionSelect(element.index)
				}
			></Line>
		</Row>
	</Container>
}
