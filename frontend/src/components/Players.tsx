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

export interface PlayerProps {
	player: {
		displayName: string
	}
}

export class Player extends React.Component<PlayerProps> {
	render(): ReactNode {
		return <div>{this.props.player.displayName}</div>
	}
}

// 'HelloProps' describes the shape of props.
// State is never set so we use the '{}' type.
export class Players extends React.Component<StandingsChartProps> {
	componentDidMount(): void {
		this.props.fetchSummary().then(console.log).catch(console.log);
	}

	private createData(): ChartData<chartjs.ChartData> {
		console.log(this.props);
		return {
			labels: this.props.sessionsTimes.map(time => new Date(time).toLocaleDateString()),
			datasets: this.props.teams.map(team => ({
				label: team.name,
				fill: false,
				lineTension: 0.05,
				backgroundColor: 'rgba(75,192,192,0.4)',
				borderColor: 'rgba(75,192,192,1)',
				borderCapStyle: 'butt',
				borderDash: [],
				borderDashOffset: 0.0,
				borderJoinStyle: 'miter',
				pointBorderColor: 'rgba(75,192,192,1)',
				pointBackgroundColor: '#fff',
				pointBorderWidth: 1,
				pointHoverRadius: 5,
				pointHoverBackgroundColor: 'rgba(75,192,192,1)',
				pointHoverBorderColor: 'rgba(220,220,220,1)',
				pointHoverBorderWidth: 2,
				pointRadius: 5,
				pointHitRadius: 10,
				data: team.scores
			}))
		}
	}

	render(): ReactNode {
		return <Line data={this.createData()}></Line>
	}
}

function mapStateToProps(state: IState): StandingsChartProps {
	return {
		sessionsTimes: state.summary?.sessions.map(session => session.startTime) ?? [],
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
)(Players);
