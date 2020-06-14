import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState } from "./IState";
import { ISummaryRetrievedAction as ContestSummaryRetrievedAction } from "./IAction";
import { ActionType } from "./ActionType";
import { ContestSummary } from "./components/ContestSummaryComponentProps";


function contestReducer(state: IState, action: Action<ActionType>): IState {
	switch (action.type) {
		case ActionType.SummaryRetrieved: {
			const contestSummaryRetrievedAction = action as ContestSummaryRetrievedAction;
			const contest = {...state.contest, ...contestSummaryRetrievedAction.contest};

			contest.teams = contestSummaryRetrievedAction.contest.teams.reduce((hash: any, next: any) => {
				hash[next._id] = next;
				return hash;
			}, {});

			const aggregateTotals: Record<string, number> = {};
			contest.sessions = contest.sessions.reverse();

			for (const session of contest.sessions) {
				for (const value of session.totals) {
					aggregateTotals[value.teamId] = (aggregateTotals[value.teamId] ?? 0) + value.uma;
				}
				session.aggregateTotals = {...aggregateTotals};
			}

			return {
				...state,
				...{
					contest
				}
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
