import React = require("react");
import { LeagueStandingChart } from "./LeagueStandingChart";
import { ISummaryRetrievedAction, ITeamsRetrievedAction } from "../IAction";
import { ActionType } from "../ActionType";
import { IState, ISummary, IPendingSession, ITeam } from "../IState";
import { connect } from "react-redux";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";

type AppThunk<AType extends Action<ActionType>, TReturn = void> =  ThunkAction<TReturn, IState, unknown, AType>;

const fetchTeams = (contestId: string): AppThunk<ITeamsRetrievedAction> => {
	return function (dispatch) {
		return fetch(`http://localhost:3000/contests/${contestId}/teams`)
			.then(response => response.json())
			.then(teams => dispatch({
				type: ActionType.TeamsRetrieved,
				teams
			}));
	}
}

const fetchSummary = (contestId: string): AppThunk<ISummaryRetrievedAction> => {
	return function (dispatch) {
		return fetch(`http://localhost:3000/contests/${contestId}/summary`)
			.then(response => response.json())
			.then(summary => {
				dispatch({
					type: ActionType.SummaryRetrieved,
					summary
				});
				return;
			});
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

interface ContestSummaryComponentDispatchProps {
	fetchTeams: (contestId: string) => void;
	fetchSummary: (contestId: string) => void;
}

interface ContestSummaryComponentStateProps extends ContestSummaryProps {
	summary: ISummary;
}

class ContestSummaryComponent extends React.Component<ContestSummaryComponentStateProps & ContestSummaryComponentDispatchProps> {
	public componentDidMount(): void {
		this.props.fetchSummary(this.props.contestId);
		this.props.fetchTeams(this.props.contestId);
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

function mapStateToProps(state: IState, props: ContestSummaryProps): ContestSummaryComponentStateProps {
	return {
		summary: state.summary,
		...props,
	}
}

export const ContestSummary = connect(
	mapStateToProps,
	{
		fetchTeams,
		fetchSummary,
	}
)(ContestSummaryComponent);
