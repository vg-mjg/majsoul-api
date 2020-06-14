import * as React from "react";
import { ReactNode } from "react";
import { Line, ChartData } from "react-chartjs-2";
import * as chartjs from "chart.js";
import { Contest, Session } from "../IState";

interface IStandingsChartProps {
	contest: Contest;
}

export class LeagueStandingChart extends React.Component<IStandingsChartProps> {
	static readonly colors = [
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

	private onClick(event?: MouseEvent, activeElements?: {}[]) {
		console.log(event, activeElements);
	}

	private onElementsClick(e: any){
		console.log(e);
	}

	private createData(): ChartData<chartjs.ChartData> {
		const sessions = this.props.contest.sessions.filter(session => session.scheduledTime < Date.now())
		const teams = Object.entries(this.props.contest.teams).map(([id, team]) => ({
			name: team.name,
			scores: sessions.map(session => session.aggregateTotals[team._id])
		}));

		return {
			labels: sessions.map(session => new Date(session.scheduledTime).toLocaleDateString()),
			datasets: teams.map((team, index) => ({
				label: team.name,
				fill: false,
				lineTension: 0.1,
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: LeagueStandingChart.colors[index],
				pointBackgroundColor: LeagueStandingChart.colors[index],
				backgroundColor: LeagueStandingChart.colors[index],
				borderColor: LeagueStandingChart.colors[index],
				pointHoverBackgroundColor: LeagueStandingChart.colors[index],
				pointHoverBorderColor: LeagueStandingChart.colors[index],
				pointBorderWidth: 1,
				pointHoverRadius: 4,
				pointHoverBorderWidth: 2,
				pointRadius: 3,
				pointHitRadius: 10,
				data: team.scores
			}))
		}
	}

	render(): ReactNode {
		if (this.props.contest == null) {
			return null;
		}

		return <Line data={this.createData()} options={{onClick: this.onClick}} onElementsClick={this.onElementsClick}></Line>
	}
}
