import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { ConnectedComponent } from "./components/Players";
import { createStore, applyMiddleware, compose } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState } from "./IState";
import { IAction } from "./IAction";
import { ActionType } from "./ActionType";

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
	(state: IState, action: IAction) => {
		if (action.type === ActionType.PlayersUpdated) {
			return { ...state, ...{ players: action.players } }
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
