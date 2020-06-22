import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { fetchGames, fetchContestSummary, FetchGamesOptions } from "../Actions";
import { IState, Contest } from "../State";
import { connect } from "react-redux";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Session } from "./Session";
import { HistoricalSession } from "./HistoricalSession";

interface ContestSummaryComponentDispatchProps {
	fetchContestSummary: (contestId: string) => void;
	fetchGames: (params: FetchGamesOptions) => void;
}

interface ContestSummaryComponentStateProps extends ContestSummaryProps {
	contest: Contest;
	games: Store.GameResult[];
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
		if (!(this.props?.games?.length > 0)) {
			this.props.fetchGames({
				last: 8
			});
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
				<Session session={nextSession}></Session>
			</Row>
			<Row className="mt-3">
				<HistoricalSession games={this.props.games?.slice(0, 8) ?? []} teams={this.props.contest.teams}></HistoricalSession>
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
		games: Object.values(state.games ?? [])?.sort((a, b) => b.end_time - a.end_time),
		...props,
	}
}

export const ContestSummary = connect(
	mapStateToProps,
	{
		fetchContestSummary,
		fetchGames,
	}
)(ContestSummaryComponent);
