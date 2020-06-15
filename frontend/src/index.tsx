import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState, Contest } from "./IState";
import { SummaryRetrievedAction, ActionType, SessionGamesRetrieved } from "./Actions";
import { ContestSummary } from "./components/ContestSummary";
import { Store } from "majsoul-api";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import * as styles from "./components/styles.sass";
import "./bootstrap.sass";

function contestReducer(state: IState, action: Action<ActionType>): IState {
	switch (action.type) {
		case ActionType.ContestSummaryRetrieved: {
			const contestSummaryRetrievedAction = action as SummaryRetrievedAction;
			const contest = {
				...state.contest,
				...contestSummaryRetrievedAction.contest,
				teams: contestSummaryRetrievedAction.contest.teams.reduce<Record<string, Store.ContestTeam<string>>>((hash, next) => {
					hash[next._id] = next;
					return hash;
				}, {}),
				sessions: contestSummaryRetrievedAction.contest.sessions.map(session => ({
					...session,
					aggregateTotals: {}
				})).reverse()
			} as Contest;

			const aggregateTotals: Record<string, number> = {};

			for (const session of contest.sessions) {
				for (const key in session.totals) {
					aggregateTotals[key] = (aggregateTotals[key] ?? 0) + session.totals[key];
				}
				session.aggregateTotals = {...aggregateTotals};
			}

			return {
				...state,
				...{ contest }
			};
		} case ActionType.SessionGamesRetrieved: {
			const sessionGamesRetrievedAction = action as SessionGamesRetrieved;
			sessionGamesRetrievedAction.sessionId
			return {
				...state,
				contest: {
					...state.contest,
					sessions: state.contest.sessions.map(session => {
						if (session._id === sessionGamesRetrievedAction.sessionId) {
							return {
								...session,
								games: sessionGamesRetrievedAction.games
							}
						}
						return session;
					})
				}
			}
		}
	}

	return state;
}

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
	contestReducer,
	{},
	composeEnhancers(
		applyMiddleware(
			thunkMiddleware
		)
	),
);

ReactDOM.render(
	<Provider store={store}>
		<BrowserRouter>
			<Container className={`${styles.feed} bg-dark px-5`}>
				<Container className={`${styles.feed} bg-secondary px-3`}>
					<Route exact path="/">
						<ContestSummary contestId="113331"/>
					</Route>
				</Container>
			</Container>
		</BrowserRouter>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
