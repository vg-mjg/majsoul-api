import * as React from "react";
import * as ReactDOM from "react-dom";

import { Hello } from "./components/Hello";
import { createStore } from "redux";
import { Provider } from "react-redux";

const store = createStore(
	(state) => state,
	(window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
);

ReactDOM.render(
	<Provider store={store}>
	<Hello compiler="TypeScript" framework="React" />
	</Provider>,
		document.getElementsByTagName("body")[0]
);
