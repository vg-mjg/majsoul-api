import * as React from "react";
import * as ReactDOM from "react-dom";
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose, Action } from "redux";
import { Provider, useDispatch } from "react-redux";
import { BrowserRouter, Route, Switch, useParams, Link } from "react-router-dom";
import { IState, Contest, ContestTeam } from "./State";
import { SummaryRetrievedAction, ActionType, SessionGamesRetrieved, RiggingTokenAquired, SessionPatched, PatchTeam, GetContestSessions, PlayMusic, SetMusic, GetContestPlayers, GetContests, ContestPatched, MajsoulAction, fetchContestSummary } from "./Actions";
import { ContestSummary } from "./components/ContestSummary";
import { ContestList } from "./components/ContestList";
import Container from 'react-bootstrap/Container';
import * as styles from "./components/styles.sass";
import "./bootstrap.sass";
import { Rest } from "majsoul-api";
import { Rigging } from "./components/rigging/Rigging";
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react'

import YouTube from 'react-youtube';
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const teamColors = [
	"#980000",
	"#ff0000",
	"#ff9900",
	"#ffff00",
	"#00ff00",
	"#00ffff",
	"#9900ff",
	"#ff00ff",
	"#4a86e8",
	"#d9d9d9",
];

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

function updatedContestRecord(state: IState, contestId: string, contest: Partial<Contest>): {
	contestsById: Record<string, Contest>,
 } {
	const originalContest = state.contestsById[contestId] ?? {};

	return {
		contestsById: {
			...state.contestsById,
			[contestId]: {
				...originalContest,
				...contest,
			} as Contest
		}
	};
}

//todo: splatting some of these states is probably not correct and triggers changes.
function contestReducer(state: IState, action: MajsoulAction): IState {
	switch (action.type) {
		case ActionType.ContestSummaryRetrieved: {
			const contest = {
				...(state.contestsById[action.contest._id] ?? {}),
				...action.contest,
				teams: teamColors.reduce<Record<string, ContestTeam>>((hash, next, index) => {
					const team = action.contest.teams == null ? null : action.contest.teams[index];
					hash[team?._id ?? index] = {...(team ?? {
						players: [],
						_id: index.toString(),
						index: index,
						anthem: undefined,
						image: undefined,
						name: undefined
					}), ...{color: teamColors[index], index: index}};
					return hash;
				}, {})
			} as Contest;

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

			return {
				...state,
				...updatedContestRecord(state, contest._id, contest)
			};
		} case ActionType.GamesRetrieved:
			case ActionType.GetContestPlayerGames:
		{
			const gamesRetrievedAction = action as SessionGamesRetrieved;
			// const contest: Contest = {
			// 	...originalContest,
			// 	sessions: originalContest?.sessions?.map(session => {
			// 		const games = gamesRetrievedAction.games.filter(g => g.sessionId === session._id);
			// 		if (games.length > 0) {
			// 			return {
			// 				...session,
			// 				games: Array.from(new Set(games.concat(gamesRetrievedAction.games ?? [])))
			// 			}
			// 		}
			// 		return session;
			// 	}) ?? []
			// };

			return {
				...state,
				games: {
					...(state.games ?? {}),
					...gamesRetrievedAction.games.reduce<Record<string, Rest.GameResult<string>>>(
						(record, next) => { record[next._id] = next; return record; }, {}
					)
				},
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
			return state;
			// const sessionPatchedAction = action as SessionPatched;
			// const contest = {...state.contest};
			// const sessionIndex = contest.sessions.findIndex(session => session._id === sessionPatchedAction.session._id);
			// contest.sessions[sessionIndex] = {
			// 	...contest.sessions[sessionIndex],
			// 	...sessionPatchedAction.session
			// };
			// return {
			// 	...state,
			// 	contest
			// }
		} case ActionType.LogOut: {
			if (state.user) {
				return {...state, user: undefined};
			}
			break;
		} case ActionType.PatchTeam: {
			return state;
			// const patchAction = action as PatchTeam;
			// const teams = {...state.contest.teams};
			// teams[patchAction.team._id] = patchAction.team;
			// return {
			// 	...state,
			// 	contest: {
			// 		...state.contest,
			// 		teams
			// 	}
			// }
		} case ActionType.GetContestSessions: {
			return state;
			// const getContestSessions = action as GetContestSessions;
			// return {
			// 	...state,
			// 	contest: {
			// 		...(state.contest ?? {} as Contest),
			// 		sessions: getContestSessions.sessions
			// 	}
			// }
		} case ActionType.PlayMusic: {
			const playMusic = action as PlayMusic;
			return {
				...state,
				musicPlayer: {
					playing: true,
					videoId: playMusic.videoId ?? state.musicPlayer.videoId
				}
			}
		// } case ActionType.SetMusic: {
		// 	const setMusic = action as SetMusic;
		// 	return {
		// 		...state,
		// 		musicPlayer: {
		// 			...state.musicPlayer,
		// 			videoId: setMusic.videoId
		// 		}
		// 	}
		// } case ActionType.StopMusic: {
		// 	return {
		// 		...state,
		// 		musicPlayer: {
		// 			...state.musicPlayer,
		// 			playing: false
		// 		}
		// 	}
		} case ActionType.GetContestPlayers: {
			const getContestPlayers = action as GetContestPlayers;
			return {
				...state,
				...updatedContestRecord(state, getContestPlayers.contestId, {
					players: getContestPlayers.players
				})
			}
		} case ActionType.GetContests: {
			const getContests = action as GetContests;
			const contests: Record<number, Contest> = {};
			for (const contest of getContests.contests) {
				contests[contest._id] = {
					...contest,
					teams: teamColors.reduce<Record<string, ContestTeam>>((hash, next, index) => {
						const team = contest.teams == null ? null : contest.teams[index];
						hash[team?._id ?? index] = {...(team ?? {
							players: [],
							_id: index.toString(),
							index: index,
							anthem: undefined,
							image: undefined,
							name: undefined
						}), ...{color: teamColors[index], index: index}};
						return hash;
					}, {})
				} as Contest;
			}

			return {
				...state,
				contestsById: {
					...state.contestsById,
					...contests
				}
			}
		} case ActionType.ContestPatched: {
			const contestPatchedAction = action as ContestPatched;
			const originalContest = state.contestsById[contestPatchedAction.contest._id];
			return {
				...state,
				...{
					contestsById: {
						...state.contestsById,
						[contestPatchedAction.contest._id]: {
							...contestPatchedAction.contest,
							teams: originalContest.teams,
							sessions: originalContest.sessions,
						}
					}
				}
			}
		} case ActionType.ContestCreated: {
			return {
				...state,
				...updatedContestRecord(state, action.contest._id, action.contest)
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
	{
		contestsById: {},
		musicPlayer: {
			playing: false,
			videoId: null
		},
	} as IState as any,
	composeEnhancers(
		applyMiddleware(
			thunkMiddleware
		)
	),
)

const persistor = persistStore(store);

function ContestFromRoute(): JSX.Element {
	const { id } = useParams<{
		id: string;
	}>();
	return <ContestSummary contestId={id}/>
}

function LatestContestSummary(): JSX.Element {
	const dispatch = useDispatch();
	const [contestId, setContestId] = React.useState<string>();
	React.useEffect(() => {
		fetchContestSummary(dispatch, "latest").then(contest => {
			setContestId(contest._id);
		});
	});

	if (contestId == null) {
		return <div>Loading...</div>;
	}

	return <ContestSummary contestId={contestId}/>
}

ReactDOM.render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<BrowserRouter>
				<Container className={`${styles.feed} bg-dark px-5`}>
					<Container className={`${styles.feed} bg-primary px-3 pb-3`} style={{display:"flex", flexDirection:"column"}}>
						<Row className="no-gutters">
							<Switch>
								<Route path="/rigging">
									<Rigging/>
								</Route>
								<Route path="/youtube">
									<YouTube videoId="Ag7W4SSl3fc" opts={{autoplay: 1} as any}></YouTube>
								</Route>
								<Route path="/contests/:id">
									<ContestFromRoute/>
								</Route>
								<Route path="/contests">
									<ContestList/>
								</Route>
								<Route path="/">
									<LatestContestSummary/>
								</Route>
							</Switch>
						</Row>
						<Row style={{flex:"1"}}></Row>
						<Row className="mt-3 justify-content-center">
							<Col md="auto"><Link className="text-dark" to="/" >Home</Link></Col>
							<Col md="auto"><a className="text-dark" href="https://boards.4channel.org/vg/catalog#s=mjg">/mjg/</a></Col>
							<Col md="auto"><a className="text-dark" href="https://repo.riichi.moe/">Repo</a></Col>
							<Col md="auto"><a className="text-dark" href="https://github.com/riichinomics/majsoul-api">Source Code/Report Issue</a></Col>
							<Col md="auto"><Link className="text-dark" to="/contests" >Contests</Link></Col>
						</Row>
					</Container>
				</Container>
			</BrowserRouter>
		</PersistGate>
	</Provider>,
	document.getElementsByTagName("body")[0]
);
