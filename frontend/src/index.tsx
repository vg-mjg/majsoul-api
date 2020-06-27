import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { IState, Contest, ContestTeam } from "./State";
import { SummaryRetrievedAction, ActionType, SessionGamesRetrieved, RiggingTokenAquired, SessionPatched, PatchTeam } from "./Actions";
import { ContestSummary } from "./components/ContestSummary";
import Container from 'react-bootstrap/Container';
import * as styles from "./components/styles.sass";
import "./bootstrap.sass";
import { teamColors } from "./components/LeagueStandingChart";
import { Store } from "majsoul-api";
import { Rigging } from "./components/Rigging";
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react'

interface RGBColor {
	r: number;
	g: number;
	b: number;
}

function hexToRgb(hex: string): RGBColor {
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

export function pickColorGradient(color1: string, color2: string, weight: number) {
	const c1 = hexToRgb(color1);
	const c2 = hexToRgb(color2);
	const w = weight * 2 - 1;
	const w1 = (w/1+1) / 2;
	const w2 = 1 - w1;
	return {
		r: Math.round(c1.r * w1 + c2.r * w2),
		g: Math.round(c1.g * w1 + c2.g * w2),
		b: Math.round(c1.b * w1 + c2.b * w2)
	};
}

function hslStyle(hsl: {h: number, s: number, l: number}) {
	return `hsl(${Math.round(hsl.h * 360)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
}

function invertHex(hex: string): string {
	return (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).substr(1).toUpperCase()
}

//todo: splatting some of these states is probably not correct and triggers changes.
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
		} case ActionType.GamesRetrieved: {
			const gamesRetrievedAction = action as SessionGamesRetrieved;
			return {
				...state,
				games: {
					...(state.games ?? {}),
					...gamesRetrievedAction.games.reduce<Record<string, Store.GameResult<string>>>(
						(record, next) => { record[next._id] = next; return record; }, {}
					)
				},
				contest: {
					...state.contest,
					sessions: state.contest.sessions.map(session => {
						const games = gamesRetrievedAction.games.filter(g => g.sessionId === session._id);
						if (games.length > 0) {
							return {
								...session,
								games: Array.from(new Set(games.concat(gamesRetrievedAction.games ?? [])))
							}
						}
						return session;
					})
				}
			}
		} case ActionType.RiggingTokenGet: {
			const riggingTokenGetAction = action as RiggingTokenAquired;
			return {
				...state,
				user: {
					token: riggingTokenGetAction.token,
				}
			}
		} case ActionType.SessionPatched: {
			const sessionPatchedAction = action as SessionPatched;
			const contest = {...state.contest};
			const sessionIndex = contest.sessions.findIndex(session => session._id === sessionPatchedAction.session._id);
			contest.sessions[sessionIndex] = {
				...contest.sessions[sessionIndex],
				...sessionPatchedAction.session
			};
			return {
				...state,
				contest
			}
		} case ActionType.LogOut: {
			if (state.user) {
				return {...state, user: undefined};
			}
			break;
		} case ActionType.PatchTeam: {
			const patchAction = action as PatchTeam;
			const teams = {...state.contest.teams};
			teams[patchAction.team._id] = patchAction.team;
			return {
				...state,
				contest: {
					...state.contest,
					teams
				}
			}
		}
	}

	return state;
}

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
	persistReducer(
		{
			key: "root",
			storage,
			whitelist: ["user"]
		},
		contestReducer
	),
	composeEnhancers(
		applyMiddleware(
			thunkMiddleware
		)
	),
)

const persistor = persistStore(store);

ReactDOM.render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<BrowserRouter>
				<Container className={`${styles.feed} bg-dark px-5`}>
					<Container className={`${styles.feed} bg-primary px-3 pb-3`}>
						<Switch>
							<Route path="/rigging">
								<Rigging/>
							</Route>
							<Route path="/">
								<ContestSummary contestId="113331"/>
							</Route>
						</Switch>
					</Container>
				</Container>
			</BrowserRouter>
		</PersistGate>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
