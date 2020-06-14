import React = require("react");
import { LeagueStandingChart } from "./LeagueStandingChart";
import { ISummaryRetrievedAction } from "../IAction";
import { ActionType } from "../ActionType";
import { IState, Contest, Team, Session } from "../IState";
import { connect } from "react-redux";
import { ThunkAction } from "redux-thunk";
import { Action } from "redux";

type AppThunk<AType extends Action<ActionType>, TReturn = void> =  ThunkAction<TReturn, IState, unknown, AType>;

const fetchContestSummary = (contestId: string): AppThunk<ISummaryRetrievedAction> => {
	return function (dispatch) {
		return fetch(`http://localhost:3000/contests/${contestId}`)
			.then(response => response.json())
			.then(contest => dispatch({
				type: ActionType.SummaryRetrieved,
				contest
			}));
	}
}

interface IPendingSessionProps {
	teams: Record<string, Team>;
	session: Session;
}

class PendingSession extends React.Component<IPendingSessionProps> {
	render() {
		const date = new Date(this.props.session?.scheduledTime);
		return <>
			<div>UTC time: {date.toLocaleString(undefined, {timeZone: "UTC"})}</div>
			<div>Local Time{date.toLocaleString()}</div>
			{this.props.session.plannedMatches.map((match, index) => <>
				<div>{index}</div>
				{match.teams.map(team => <div key={team._id}>{this.props.teams[team._id].name}</div>)}
			</>)}
		</>
	}
}

interface ContestSummaryComponentDispatchProps {
	fetchContestSummary: (contestId: string) => void;
}

interface ContestSummaryComponentStateProps extends ContestSummaryProps {
	contest: Contest;
}

class ContestSummaryComponent extends React.Component<ContestSummaryComponentStateProps & ContestSummaryComponentDispatchProps> {
	public componentDidMount(): void {
		this.props.fetchContestSummary(this.props.contestId);
	}

	render() {
		if (this.props.contest == null) {
			return null;
		}

		return <>
			<h1>{this.props.contest.name}</h1>
			<LeagueStandingChart contest={this.props.contest} ></LeagueStandingChart>
			<PendingSession session={this.props.contest.sessions.find(session => session.scheduledTime > Date.now())} teams={this.props.contest.teams}></PendingSession>
		</>
	}
}

interface ContestSummaryProps {
	contestId: string;
}

function mapStateToProps(state: IState, props: ContestSummaryProps): ContestSummaryComponentStateProps {
	return {
		contest: state.contest,
		...props,
	}
}

export const ContestSummary = connect(
	mapStateToProps,
	{
		fetchContestSummary,
	}
)(ContestSummaryComponent);
