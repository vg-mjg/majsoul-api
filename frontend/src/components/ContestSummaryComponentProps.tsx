import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { ISummaryRetrievedAction, ActionType, AppThunk } from "../Actions";
import { IState, Contest, Session } from "../IState";
import { connect } from "react-redux";
import { Store } from "majsoul-api";

const fetchContestSummary = (contestId: string): AppThunk<ISummaryRetrievedAction> => {
	return function (dispatch) {
		return fetch(`http://localhost:3000/contests/${contestId}`)
			.then(response => response.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest
			}));
	}
}

const fetchSessionGamesSummary = (sessionId: string): AppThunk<ISummaryRetrievedAction> => {
	return function (dispatch) {
		const url = new URL(`http://localhost:3000/games?sessions={${sessionId}`)
		url.search = new URLSearchParams({
			sessions: sessionId
		}).toString();


		return fetch(url.toString())
			.then(response => response.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest
			}));
	}
}

interface IPendingSessionProps {
	teams: Record<string, Store.ContestTeam>;
	session: Session;
}

class PendingSession extends React.Component<IPendingSessionProps> {
	render() {
		if (this.props.session == null) {
			return null;
		}

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

// interface GameResultSummaryProps {
// 	teams: Record<string, Team>;
// 	game: GameResult;
// }

// class GameResultSummary extends React.Component<GameResultSummaryProps> {
// 	render() {
// 		return <>
// 			{this.props.game.players.map(player => )}
// 		</>
// 	}
// }

interface HistoricalSessionProps {
	teams: Record<string, Store.ContestTeam>;
	session: Session;
}

class HistoricalSession extends React.Component<HistoricalSessionProps> {
	render() {
		const date = new Date(this.props.session?.scheduledTime);
		return <>
			{this.props.session.games.map(game => <>
				<div>{game.players}</div>
				<div></div>
				<div></div>
			</>)}
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
	fetchSessionGamesSummary: (sessionId: string) => void;
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

		const nextSession = this.props.contest.sessions.find(session => session.scheduledTime > Date.now());
		const currentSession = this.props.contest.sessions.slice(0).reverse().find(session => session.scheduledTime <= Date.now());
		if (currentSession?.games != null) {
			this.props.fetchSessionGamesSummary(currentSession._id);
		}

		return <>
			<h1>{this.props.contest.name}</h1>
			<LeagueStandingChart contest={this.props.contest} ></LeagueStandingChart>
			<PendingSession session={nextSession} teams={this.props.contest.teams}></PendingSession>
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
		fetchSessionGamesSummary,
	}
)(ContestSummaryComponent);
