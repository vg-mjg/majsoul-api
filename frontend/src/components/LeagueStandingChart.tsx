import * as React from "react";
import { connect } from "react-redux";
import { IState } from "../IState";
import { ActionType } from "../ActionType";
import { ISummaryRetrievedAction } from "../IAction";
import { ReactNode } from "react";
import { Line, ChartData } from "react-chartjs-2";
import * as chartjs from "chart.js";

function fetchSummary() {
	return function (dispatch: React.Dispatch<ISummaryRetrievedAction>) {
		return fetch("http://localhost:3000/contests/113331/summary")
			.then(response => response.json())
			.then(summary => dispatch({
				type: ActionType.SummaryRetrieved,
				summary
			}));
	}
}

export interface StandingsChartProps {
	sessionsTimes: number[];
	teams: {
		name: string;
		scores: number[];
	}[],
	fetchSummary?: () => Promise<[]>;
}

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class LeagueStandingChart extends React.Component<StandingsChartProps> {
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

	public componentDidMount(): void {
		this.props.fetchSummary().then(console.log).catch(console.log);
	}


	private createData(): ChartData<chartjs.ChartData> {
		console.log(this.props);
		return {
			labels: this.props.sessionsTimes.map(time => new Date(time).toLocaleDateString()),
			datasets: this.props.teams.map((team, index) => ({
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
		return <Line data={this.createData()} options={{onClick: this.onClick}} onElementsClick={this.onElementsClick}></Line>
	}
}

function mapStateToProps(state: IState): StandingsChartProps {
	return {
		sessionsTimes: (state.summary?.sessions.map(session => session.startTime) ?? []),
		teams: state.summary?.teams.map(team => ({
			name: team.name,
			scores: state.summary.sessions.map(session => session.standings[team.id])
		})) ?? []
	}
}

export const ConnectedComponent = connect(
	mapStateToProps,
	{
		fetchSummary: fetchSummary
	}
)(LeagueStandingChart);
