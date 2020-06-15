import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route } from "react-router-dom";
import { IState, Contest, ContestTeam } from "./IState";
import { SummaryRetrievedAction, ActionType, SessionGamesRetrieved } from "./Actions";
import { ContestSummary } from "./components/ContestSummary";
import Container from 'react-bootstrap/Container';
import * as styles from "./components/styles.sass";
import "./bootstrap.sass";
import { teamColors } from "./components/LeagueStandingChart";

function hexToRgb(hex: string) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : null;
}


function rgbToHsl(color: string) {
	let {r, g, b} = hexToRgb(color);
	r /= 255, g /= 255, b /= 255;

	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s;
	const l = (max + min) / 2;

	if (max == min) {
		h = s = 0; // achromatic
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
		}

		h /= 6;
	}

	return {h, s, l};
}

function hslStyle(hsl: {h: number, s: number, l: number}) {
	return `hsl(${Math.round(hsl.h * 360)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
}

function invertHex(hex: string): string {
	return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

function contestReducer(state: IState, action: Action<ActionType>): IState {
	switch (action.type) {
		case ActionType.ContestSummaryRetrieved: {
			const contestSummaryRetrievedAction = action as SummaryRetrievedAction;
			const contest = {
				...state.contest,
				...contestSummaryRetrievedAction.contest,
				teams: contestSummaryRetrievedAction.contest.teams.reduce<Record<string, ContestTeam>>((hash, next, index) => {
					hash[next._id] = {...next, ...{color: teamColors[index], index: index}};
					return hash;
				}, {}),
				sessions: contestSummaryRetrievedAction.contest.sessions.map(session => ({
					...session,
					aggregateTotals: {}
				})).reverse()
			} as Contest;

			const aggregateTotals: Record<string, number> = {};

			const hoverChange = 0.1;
			for (const team of Object.values(contest.teams)) {
				const hslColor = rgbToHsl(team.color);
				document.documentElement.style.setProperty(`--team-${team.index}-base`, team.color);

				//hslStyle(rgbToHsl(invertHex(team.color.slice(1)))));
				document.documentElement.style.setProperty(`--team-${team.index}-color`, hslColor?.l >= .4 ?  "black" : "white");

				document.documentElement.style.setProperty(`--team-${team.index}-border`, hslStyle({...hslColor, l: 0.35}));

				if (hslColor.l >= .5) {
					hslColor.l = Math.max(hslColor.l - hoverChange, 0);
				} else {
					hslColor.l = Math.min(hslColor.l + hoverChange, 1);
				}

				document.documentElement.style.setProperty(`--team-${team.index}-hover`, hslStyle(hslColor));
			}

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
				<Container className={`${styles.feed} bg-secondary px-3 pb-3`}>
					<Route exact path="/">
						<ContestSummary contestId="113331"/>
					</Route>
				</Container>
			</Container>
		</BrowserRouter>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
