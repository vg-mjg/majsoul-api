import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { SummaryRetrievedAction, ActionType, AppThunk, SessionGamesRetrieved } from "../Actions";
import { IState, Contest, Session } from "../IState";
import { connect } from "react-redux";
import { Store } from "majsoul-api";
import Alert from 'react-bootstrap/Alert';

const fetchContestSummary = (contestId: string): AppThunk<SummaryRetrievedAction> => {
	return function (dispatch) {
		return fetch(`http://localhost:3000/contests/${contestId}`)
			.then(response => response.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest
			}));
	}
}

const fetchSessionGamesSummary = (sessionId: string): AppThunk<SessionGamesRetrieved> => {
	return function (dispatch) {
		const url = new URL(`http://localhost:3000/games?sessions={${sessionId}`)
		url.search = new URLSearchParams({
			sessions: sessionId
		}).toString();


		return fetch(url.toString())
			.then(response => response.json())
			.then(games => dispatch({
				type: ActionType.SessionGamesRetrieved,
				sessionId,
				games
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
				{match.teams.map(team =>
					<Alert key={team._id} variant={"primary"}>
						{this.props.teams[team._id].name}
					</Alert>
				)}
			</>)}
		</>
	}
}

interface GameResultSummaryProps {
	teams: Record<string, Store.ContestTeam>;
	game: Store.GameResult;
}

class GameResultSummary extends React.Component<GameResultSummaryProps> {
	render() {
		return <>
			{this.props.game.players.map(player =>
				<Alert key={player._id} variant={"primary"}>
					{this.findPlayerInformation(player._id).player.displayName}
				</Alert>
			)}
		</>
	}

	private findPlayerInformation(playerId: string) {
		for (const teamId in this.props.teams){
			const player = this.props.teams[teamId].players.find(player => player._id === playerId);
			if (player) {
				return {
					player,
					team: this.props.teams[teamId]
				}
			}
		}
		return null;
	}
}

interface HistoricalSessionProps {
	teams: Record<string, Store.ContestTeam>;
	session: Session;
}

class HistoricalSession extends React.Component<HistoricalSessionProps> {
	render() {
		if(this.props?.session?.games == null){
			return null;
		}

		const date = new Date(this.props.session.scheduledTime);
		return <>
			{this.props.session.games.map(game => <GameResultSummary key={game._id} game={game} teams={this.props.teams}></GameResultSummary>)}
			<div>UTC time: {date.toLocaleString(undefined, {timeZone: "UTC"})}</div>
			<div>Local Time{date.toLocaleString()}</div>
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
		if (currentSession?.games == null) {
			this.props.fetchSessionGamesSummary(currentSession._id);
		}

		return <>
			<h1 className="ml-5 my-4">{this.props.contest.name}</h1>
			<LeagueStandingChart contest={this.props.contest} ></LeagueStandingChart>
			<PendingSession session={nextSession} teams={this.props.contest.teams}></PendingSession>
			<HistoricalSession session={currentSession} teams={this.props.contest.teams}></HistoricalSession>
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
