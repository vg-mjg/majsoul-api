import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState, Contest } from "./IState";
import { ISummaryRetrievedAction as ContestSummaryRetrievedAction, ActionType } from "./Actions";
import { ContestSummary } from "./components/ContestSummaryComponentProps";
import { Store } from "majsoul-api";

function contestReducer(state: IState, action: Action<ActionType>): IState {
	switch (action.type) {
		case ActionType.ContestSummaryRetrieved: {
			const contestSummaryRetrievedAction = action as ContestSummaryRetrievedAction;
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
				})).slice(0).reverse()
			} as Contest;

			const aggregateTotals: Record<string, number> = {};

			for (const session of contest.sessions) {
				console.log(new Date(session.scheduledTime).toString());
				for (const key in session.totals) {
					aggregateTotals[key] = (aggregateTotals[key] ?? 0) + session.totals[key];
				}
				session.aggregateTotals = {...aggregateTotals};
			}

			return {
				...state,
				...{ contest }
			};
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
			<Route exact path="/">
				<ContestSummary contestId="113331"/>
			</Route>
		</BrowserRouter>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
