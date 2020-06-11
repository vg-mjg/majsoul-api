import React = require("react");
import { LeagueStandingChart } from "./LeagueStandingChart";
import { ISummaryRetrievedAction } from "../IAction";
import { ActionType } from "../ActionType";
import { IState, ISummary } from "../IState";
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

interface ContestSummaryComponentProps extends ContestSummaryProps {
	summary: ISummary;
	fetchSummary?: () => Promise<void>;
}

class ContestSummaryComponent extends React.Component<ContestSummaryComponentProps> {
	public componentDidMount(): void {
		this.props.fetchSummary();
	}

	render() {
		return <>
			<LeagueStandingChart summary={this.props.summary} ></LeagueStandingChart>
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
