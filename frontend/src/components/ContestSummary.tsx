import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { SummaryRetrievedAction, ActionType, AppThunk, SessionGamesRetrieved } from "../Actions";
import { IState, Contest, Session, ContestTeam } from "../IState";
import { connect } from "react-redux";
import { Store } from "majsoul-api";
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import * as moment from "moment-timezone";
import * as styles from "./styles.sass"

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

interface IMatchProps {
	teams: Record<string, ContestTeam>;
	match: Store.Match;
}

class Match extends React.Component<IMatchProps> {
	private createButton(team: ContestTeam) {
		return <Button block className={(styles as any)[`team${team.index}`]}>{team.name}</Button>
	}

	render() {
		const teams = Object.values(this.props.teams);
		const cellStyle = "mb-1 pl-0 pr-1";
		const rowStyle = "pl-1";
		return <Container className="bg-danger pt-1 rounded">
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(teams[0])}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(teams[1])}
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(teams[2])}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(teams[3])}
				</Col>
			</Row>
		</Container>
	}
}

interface TimerProps {
	targetTime: number;
}

interface TimerState {
	time: number;
}

class CountdownTimer extends React.Component<TimerProps, TimerState> {
	private interval: any;
	componentDidMount() {
		this.interval = setInterval(() => {
			this.setState(
				{
					...this.state,
					...{
						time: Date.now()
					}
				}
			)
		}, 1000);
	}

	componentWillUnmount(){
		clearInterval(this.interval);
	}

	render() {
		if (this.state?.time == null) {
			return null;
		}

		const difference = moment.duration(moment(this.props.targetTime).diff(moment(this.state.time)));
		return <h2>{difference.days()}d {difference.hours()}:{difference.minutes()}:{difference.seconds()}</h2>
	}
}

interface PendingSessionProps {
	teams: Record<string, ContestTeam>;
	session: Session;
}

class PendingSession extends React.Component<PendingSessionProps> {
	render() {
		if (this.props.session == null) {
			return null;
		}

		return <Container fluid className="bg-dark rounded text-light">
			<Row className="py-3 px-2">
				<Col md="auto">
					<Container>
						<Row>
							{moment(this.props.session.scheduledTime).tz("UTC").format("LT l")} UTC
						</Row>
						<Row>
							{moment(this.props.session.scheduledTime).calendar()} in {moment.tz.guess()}
						</Row>
					</Container>
				</Col>
				<Col className="text-right align-self-center">
					<CountdownTimer targetTime={this.props.session.scheduledTime}></CountdownTimer>
				</Col>
			</Row>
			<Row>
				{this.props.session.plannedMatches.map((match, index) =>
					<Container className="mx-2 mb-2 px-0" key={index}><Match match={match} teams={this.props.teams}></Match></Container>
				)}
			</Row>
		</Container>;
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

		return <Container>
			<Row>
				<h1 className="ml-5 my-4">{this.props.contest.name}</h1>
			</Row>
			<Row className="mt-5">
				<LeagueStandingChart contest={this.props.contest} ></LeagueStandingChart>
			</Row>
			<Row className="mt-5">
				<PendingSession session={nextSession} teams={this.props.contest.teams}></PendingSession>
			</Row>
			<Row className="mt-5">
				<HistoricalSession session={currentSession} teams={this.props.contest.teams}></HistoricalSession>
			</Row>
		</Container>
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
