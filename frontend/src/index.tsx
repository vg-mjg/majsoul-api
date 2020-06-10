import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { ConnectedComponent } from "./components/LeagueStandingChart";
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState } from "./IState";
import { ISummaryRetrievedAction } from "./IAction";
import { ActionType } from "./ActionType";


const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
	(state: IState, action: Action<ActionType>) => {
		if (action.type === ActionType.SummaryRetrieved) {
			return { ...state, ...{ summary: (action as ISummaryRetrievedAction).summary } }
		}
		return state;
	},
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
				<ConnectedComponent/>
			</Route>
		</BrowserRouter>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
