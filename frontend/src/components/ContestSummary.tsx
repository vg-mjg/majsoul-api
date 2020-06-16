import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { SummaryRetrievedAction, ActionType, AppThunk, SessionGamesRetrieved } from "../Actions";
import { IState, Contest, Session, ContestTeam } from "../IState";
import { connect } from "react-redux";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import * as moment from "moment-timezone";
import * as styles from "./styles.sass"
import { pickColorGradient } from "..";

function buildApiUrl(path: string): URL {
	if (process.env.NODE_ENV === "production") {
		return new URL(`${location.protocol}//${location.host}/api/${path}`);
	}
	return new URL(`${location.protocol}//${location.hostname}:9515/${path}`);
}

const fetchContestSummary = (contestId: string): AppThunk<SummaryRetrievedAction> => {
	return function (dispatch) {
		return fetch(buildApiUrl(`contests/${contestId}`).toString())
			.then(response => response.json())
			.then(contest => dispatch({
				type: ActionType.ContestSummaryRetrieved,
				contest
			}));
	}
}

const fetchSessionGamesSummary = (sessionId: string): AppThunk<SessionGamesRetrieved> => {
	return function (dispatch) {
		const url = buildApiUrl(`games`);
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

function findPlayerInformation(playerId: string, teams: Record<string, ContestTeam>): {team: ContestTeam, player: Store.Player} {
	for (const teamId in teams){
		const player = teams[teamId].players.find(player => player._id === playerId);
		if (player) {
			return {
				player,
				team: teams[teamId]
			}
		}
	}
	return null;
}

interface IMatchProps {
	teams: Record<string, ContestTeam>;
	match: Store.Match;
}

class Match extends React.Component<IMatchProps> {
	private createButton(teamIndex: number) {
		const team = this.props.teams[this.props.match.teams[teamIndex]._id];
		return <Button block disabled className={`${(styles as any)[`team${team.index}`]} font-weight-bold text-uppercase p-0`}>{team.name}</Button>
	}

	render() {
		const cellStyle = "mb-1 pl-0 pr-1";
		const rowStyle = "pl-1";
		return <Container className="bg-primary pt-1 rounded">
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(0)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(1)}
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(2)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(3)}
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
		return <h3 className="mb-0">Next Session in {difference.days() > 0 && `${difference.days()}d`} {difference.hours()}:{difference.minutes()}:{difference.seconds()}</h3>
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
		</Container>
	}
}

interface GameResultSummaryProps {
	teams: Record<string, ContestTeam>;
	game: Store.GameResult;
}


//todo: use wind enum from types package
class GameResultSummary extends React.Component<GameResultSummaryProps> {
	private static getSeatCharacter(seat: number): string {
		switch(seat) {
			case 0:
				return "東";
			case 1:
				return "南";
			case 2:
				return "西";
			case 3:
				return "北";
		}
		return null;
	}

	private createButton(seat: number) {
		const player = this.props.game.players[seat];
		const playerInfo = findPlayerInformation(player._id, this.props.teams);
		const scoreColor = pickColorGradient(
			this.props.game.finalScore[seat].uma > 0 ? "93c47d" : "e06666",
			"ffd966",
			Math.min(Math.abs(this.props.game.finalScore[seat].uma / 1000 / 50) , 1)
		);
		return <Container className={`font-weight-bold p-0 rounded bg-primary text-dark`}>
			<Row className="no-gutters">
				<Col md="auto" className={`${(styles as any)[`team${playerInfo.team.index}`]} rounded-left px-2`}>
					{GameResultSummary.getSeatCharacter(seat)}
				</Col>
				<Col md="auto" className="border-right border-top border-bottom px-2">
					{this.props.game.finalScore.map((score, index) => ({score, index})).sort((a, b) => b.score.uma - a.score.uma).findIndex(s => s.index === seat) + 1}
				</Col>
				<Col className="border-right border-top border-bottom text-center">
					{playerInfo.player.displayName}
				</Col>
				<Col md="auto" style={{minWidth: "112px", backgroundColor: `rgb(${scoreColor.r}, ${scoreColor.g}, ${scoreColor.b})`} } className="text-center border-right border-top border-bottom rounded-right">
					{this.props.game.finalScore[seat].score}({this.props.game.finalScore[seat].uma / 1000})
				</Col>
			</Row>
		</Container>
	}

	render() {
		const cellStyle = "mb-1 pl-0 pr-1";
		const rowStyle = "pl-1 no-gutters";
		return <Container className="px-1 py-2">
			<Row className={`${rowStyle} px-2 pb-2`}>
				<Col className="">
					{moment(this.props.game.end_time).calendar()}
				</Col>
				<Col md="auto" className="">
					<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${this.props.game.majsoulId}`} rel="noreferrer" target="_blank">View on Majsoul</a>
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(0)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(3)}
				</Col>
			</Row>
			<Row className={rowStyle}>
				<Col className={cellStyle}>
					{this.createButton(1)}
				</Col>
				<Col className={cellStyle}>
					{this.createButton(2)}
				</Col>
			</Row>
		</Container>
	}
}

interface HistoricalSessionProps {
	teams: Record<string, ContestTeam>;
	session: Session;
}

class HistoricalSession extends React.Component<HistoricalSessionProps> {
	render() {
		if(this.props?.session?.games == null){
			return null;
		}

		const date = new Date(this.props.session.scheduledTime);
		return <Container className="bg-dark text-white rounded">
			<Row className="px-4 pt-3 pb-2">
				<Col></Col>
				<Col md="auto" className="h3">Recent Games</Col>
			</Row>
			<Row>
				{this.props.session.games.map(game =>
					<Container key={game._id} className="px-0 border-top">
						<GameResultSummary game={game} teams={this.props.teams}></GameResultSummary>
					</Container>
				)}
			</Row>
		</Container>
	}
}

interface ContestSummaryComponentDispatchProps {
	fetchContestSummary: (contestId: string) => void;
	fetchSessionGamesSummary: (sessionId: string) => void;
}

interface ContestSummaryComponentStateProps extends ContestSummaryProps {
	contest: Contest;
}

interface ContestSummaryComponentState {
	secret: boolean;
}

class ContestSummaryComponent extends React.Component<ContestSummaryComponentStateProps & ContestSummaryComponentDispatchProps, ContestSummaryComponentState> {
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
			<Row className="px-4 pt-4 pb-3">
				<Col>
					<h1 className="align-self-center" onClick={() => this.showSecret()}><u style={{cursor: "pointer"}}>{this.props.contest.name}</u></h1>
				</Col>
				<Col md="auto" className="align-self-center">
					<i>
						{this.state?.secret
							? "This is a Shamikoposter world you're just living in it."
							: "Winning is for Losers."}
						</i>
					</Col>
			</Row>
			<Row className="mt-3">
				<LeagueStandingChart contest={this.props.contest} ></LeagueStandingChart>
			</Row>
			<Row className="mt-3">
				<PendingSession session={nextSession} teams={this.props.contest.teams}></PendingSession>
			</Row>
			<Row className="mt-3">
				<HistoricalSession session={currentSession} teams={this.props.contest.teams}></HistoricalSession>
			</Row>
		</Container>
	}

	private showSecret() {
		this.setState({secret: true});
		new Audio(require("../../assets/tuturu.mp3").default).play();
		setTimeout(() => this.setState({secret: false}), 5000);
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
