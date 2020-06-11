import React = require("react");
import { LeagueStandingChart } from "./LeagueStandingChart";
import { ISummaryRetrievedAction } from "../IAction";
import { ActionType } from "../ActionType";
import { IState, ISummary, IPendingSession, ITeam } from "../IState";
import { connect } from "react-redux";

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

interface IPendingSessionProps {
	teams: Record<string, ITeam>;
	session: IPendingSession;
}

class PendingSession extends React.Component<IPendingSessionProps> {
	render() {
		const date = new Date(this.props.session?.scheduledTime);
		return <>
			<div>UTC time: {date.toLocaleString(undefined, {timeZone: "UTC"})}</div>
			<div>Local Time{date.toLocaleString()}</div>
			{this.props.session.plannedMatches.map((match, index) => <>
				<div>{index}</div>
				{match.teams.map(team => <div key={team.id}>{this.props.teams[team.id].name}</div>)}
			</>)}
		</>
	}
}

interface ContestSummaryComponentProps extends ContestSummaryProps {
	summary: ISummary;
	fetchSummary?: () => Promise<void>;
}

class ContestSummaryComponent extends React.Component<ContestSummaryComponentProps> {
	public componentDidMount(): void {
		this.props.fetchSummary();
	}

	render() {
		if (this.props.summary == null) {
			return null;
		}

		return <>
			<h1>{this.props.summary.name}</h1>
			<LeagueStandingChart summary={this.props.summary} ></LeagueStandingChart>
			<PendingSession session={this.props.summary.nextSession} teams={this.props.summary.teams}></PendingSession>
		</>
	}
}

interface ContestSummaryProps {
	contestId: string;
}

function mapStateToProps(state: IState, props: ContestSummaryProps): ContestSummaryComponentProps {
	return {
		summary: state.summary,
		...props,
	}
}

export const ContestSummary = connect(
	mapStateToProps,
	{ fetchSummary	}
)(ContestSummaryComponent);
