import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState, ITeam } from "./IState";
import { ISummaryRetrievedAction, ITeamsRetrievedAction } from "./IAction";
import { ActionType } from "./ActionType";
import { ContestSummary } from "./components/ContestSummaryComponentProps";


function contestReducer(state: IState, action: Action<ActionType>): IState {
	switch (action.type) {
		case ActionType.SummaryRetrieved: {
			return { ...state, ...{ summary: (action as ISummaryRetrievedAction).summary } }
		} case ActionType.TeamsRetrieved: {
			const teamsRetrievedAction = action as ITeamsRetrievedAction;
			return {
				...state,
				...{
					contest: {
						teams: teamsRetrievedAction.teams.reduce((teams, team) => {
							teams[team.id] = team;
							return teams;
						}, {} as Record<string, ITeam>)
					}
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
