import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { Hello } from "./components/Hello";
import { createStore, applyMiddleware, compose } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
	(state) => state,
	composeEnhancers(
		applyMiddleware(
			thunkMiddleware
		)
	)
);

ReactDOM.render(
	<Provider store={store}>
		<BrowserRouter>
			<Route exact path="/">
				<Hello compiler="TypeScript" framework="React" />
			</Route>
		</BrowserRouter>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
