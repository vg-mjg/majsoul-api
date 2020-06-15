import * as React from "react";
import { ReactNode } from "react";
import { Line, ChartData } from "react-chartjs-2";
import * as chartjs from "chart.js";
import { Contest } from "../IState";
import Container from 'react-bootstrap/Container';
import * as moment from "moment";

interface IStandingsChartProps {
	contest: Contest;
}

export const teamColors = [
	"#980000",
	"#ff0000",
	"#ff9900",
	"#ffff00",
	"#00ff00",
	"#00ffff",
	"#9900ff",
	"#ff00ff",
	"#4a86e8",
	"#d9d9d9",
]

chartjs.defaults.global.defaultFontColor = "white";

export class LeagueStandingChart extends React.Component<IStandingsChartProps> {

	private onClick(event?: MouseEvent, activeElements?: {}[]) {
		console.log(event, activeElements);
	}

	private onElementsClick(e: any){
		console.log(e);
	}

	private createData(): ChartData<chartjs.ChartData> {
		const sessions = this.props.contest.sessions.filter(session => session.scheduledTime < Date.now());
		const teams = Object.entries(this.props.contest.teams).map(([id, team]) => ({
			name: team.name,
			scores: [0].concat(sessions.map(session => session.aggregateTotals[team._id] / 1000))
		}));

		return {
			labels: ["Start"].concat(sessions.map(session => {
				const time =  moment(session.scheduledTime).tz('UTC');
				return `${time.hours() === 18 ? 'EU' : 'US'} ${time.format('D/M')}`
			})),
			datasets: teams.map((team, index) => ({
				label: team.name,
				fill: false,
				lineTension: 0.1,
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: teamColors[index],
				pointBackgroundColor: teamColors[index],
				backgroundColor: teamColors[index],
				borderColor: teamColors[index],
				pointHoverBackgroundColor: teamColors[index],
				pointHoverBorderColor: teamColors[index],
				pointBorderWidth: 1,
				pointHoverRadius: 4,
				pointHoverBorderWidth: 2,
				pointRadius: 3,
				pointHitRadius: 10,
				data: team.scores,
				yAxisID: "uma",
				xAxisID: "sessions",
			}))
		}
	}

	render(): ReactNode {
		if (this.props.contest == null) {
			return null;
		}

		return <Container className="bg-dark px-2 py-3 rounded">
			<Line
				data={this.createData()}
				options={{
					onClick: this.onClick,
					scales: {
						yAxes: [
							{
								id: "uma",
								position: "right",
								gridLines: {
									color: "#666666",
									zeroLineColor: "#666666"
								}
							},
						],
						xAxes: [
							{
								id: "sessions",
								gridLines: {
									display: false
								}
							},
						]
					},
					legend: {
						display: false
					}
				}}
				onElementsClick={this.onElementsClick}
			></Line>
		</Container>
	}
}
