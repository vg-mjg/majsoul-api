import * as React from "react";
import { LeagueStandingChart } from "./LeagueStandingChart";
import { fetchContestSummary, fetchContestSessions, ActionType, fetchContestPlayers, fetchGamesHook, fetchContestPlayerGames, fetchContests, fetchYakuman, fetchContestPlayersDirect } from "../Actions";
import { IState, Contest } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import Nav from 'react-bootstrap/Nav';
import Badge from 'react-bootstrap/Badge';
import { Session } from "./Session";
import { Teams } from "./Teams";
import YouTube from 'react-youtube';
import { Rest } from "majsoul-api";
import { Han, RoundResult, AgariInfo } from "majsoul-api/dist/majsoul/types";
import Accordion from "react-bootstrap/Accordion";
import { GameResultSummary, getSeatCharacter } from "./GameResultSummary";
import moment = require("moment");
import { Link, useHistory, useLocation } from "react-router-dom";
import nantoka_nare from "../../assets/nantoka_nare.mp3";
import { ContestPlayer } from "majsoul-api/dist/rest";

function SongPlayer(props: {videoId: string, play?: boolean}): JSX.Element {
	const [player, setPlayer] = React.useState<YT.Player>(null);
	React.useEffect(() => {
		if (player == null || !props.play) {
			return;
		}
		player.playVideo();
		return () => player.stopVideo();
	}, [player, props.play, props.videoId]);
	return <div style={{display:"none"}}>
		<YouTube
			videoId={props.videoId}
			onReady={(event) => setPlayer(event.target)}
			onStateChange={(event) => event.data === 0 && event.target.playVideo()}
		>
		</YouTube>
	</div>
}

export function ContestSummary(props: {contestId: string}): JSX.Element {
	const contest = useSelector((state: IState) => state.contest);
	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchContestSummary(dispatch, props.contestId);
		fetchContestSessions(dispatch, props.contestId);
	}, [props.contestId]);

	const [secret, setSecret] = React.useState(false);
	React.useEffect(() => {
		if (!secret) {
			return;
		}
		// new Audio(nantoka_nare as any).play()
	}, [secret]);

	if (contest == null) {
		return <Container className="text-light text-center pt-4">
			<h5 className="bg-dark rounded py-3">
				Tourney #{props.contestId} doesn't exist.
			</h5>
		</Container>;
	}

	return <Container>
		<SongPlayer videoId="5P-DTsVE1ZQ" play={secret}/>
		<Row className="px-4 pt-4 pb-3 no-gutters align-items-center">
			<Col>
				<h1 onClick={() => setSecret(true)}><u style={{cursor: "pointer"}}>{contest?.name}</u></h1>
			</Col>
			<Col md="auto">
				<i>
					{!secret
						? ">not playing as a saki character in the saki tourney"
						: ">playing as a saki character in the saki tourney"}
					</i>
				</Col>
		</Row>

		{contest != null ?
			<>
				<TourneyContestSummary contestId={contest._id}/>
				<YakumanDisplay contestId={contest._id}/>
			</>
		: null}
	</Container>
}

const maxGames = 4;
const sakiTeamInfo: Record<string, {color:string, name:string, blackFont?: boolean}> = {
	"Kazekoshi": {
		color: "#ffd966",
		name: "風越",
	},
	"Kiyosumi": {
		color: "#6fa8dc",
		name: "清澄",
	},
	"Ryuumonbuchi": {
		color: "#e06666",
		name: "龍門渕",
	},
	"Tsuruga": {
		color: "#b4a7d6",
		name: "敦賀",
	},
	"Achiga": {
		color: "#df8cea",
		name: "阿知賀",
	},
	"Shiraitodai": {
		color: "#3e5bdd",
		name: "白糸台",
	},
	"Senriyama": {
		color: "#cea84e",
		name: "千里山",
	},
	"Shindouji": {
		color: "#7954d8",
		name: "新道寺",
	},
	"Eisui": {
		color: "#ee0000",
		name: "永水",
	},
	"Miyamori": {
		color: "#71ba50",
		name: "宮守",
	},
	"Himematsu": {
		color: "#d3b700",
		name: "姫松",
	}
}

function TeamIcon(props: {team:string, seeded: boolean}): JSX.Element {
	return <h4 className="pr-2 text-dark">
		{props.seeded
			? <Badge className={`bg-light ${props.team ? "mr-2" : ""}`}>
				シード
			</Badge>
			: null
		}
		{ props.team
			? <Badge style={{
				backgroundColor: sakiTeamInfo[props.team].color,
				color: sakiTeamInfo[props.team].blackFont ? undefined : "white"
			}}>
				{sakiTeamInfo[props.team].name}
			</Badge>
			: null
		}
	</h4>
}

function getYakumanName(han: Han[]): string {
	const names = han.map(h => {
		switch(h) {
			case Han.Blessing_of_Heaven:
				return "天和";
			case Han.Blessing_of_Earth:
				return "地和";
			case Han.Big_Three_Dragons:
				return "大三元";
			case Han.Four_Concealed_Triplets:
				return "四暗刻";
			case Han.All_Honors:
				return "字一色";
			case Han.All_Green:
				return "绿一色";
			case Han.All_Terminals:
				return "清老頭";
			case Han.Thirteen_Orphans:
				return "国士無双";
			case Han.Four_Little_Winds:
				return "小四喜";
			case Han.Four_Quads:
				return "四槓子";
			case Han.Nine_Gates:
				return "九蓮宝燈";
			case Han.Eight_time_East_Staying:
				return "八連荘";
			case Han.True_Nine_Gates:
				return "純正九蓮宝燈";
			case Han.Single_wait_Four_Concealed_Triplets:
				return "四暗刻単騎";
			case Han.Thirteen_wait_Thirteen_Orphans:
				return "国士無双十三面待ち";
			case Han.Four_Big_Winds:
				return "大四喜";
			case Han.Hand_of_Man:
				return "人和";
			case Han.Big_Wheels:
				return "大車輪";
			case Han.Bamboo_Forest:
				return "大竹林";
			case Han.Numerous_Neighbours:
				return "大数隣";
			case Han.Ishinouenimosannen:
				return "石の上にも三年";
			case Han.Big_Seven_Stars:
				return "大七星";
		}
		return null;
	}).filter(h => h !== null);
	return names.length ? names.join(" ") : "数え";
}

function getYakumanAgari(round: RoundResult): AgariInfo[] {
	if (round.tsumo) {
		if (round.tsumo.value === 32000 || round.tsumo.value === 48000) {
			return [round.tsumo];
		}
		return [];
	}

	if (!round.rons) {
		return []
	}

	return round.rons.filter(ron => ron.value === 32000 || ron.value === 48000);
}

export function YakumanDisplay(props: {contestId: string}): JSX.Element {
	const dispatch = useDispatch();
	React.useEffect(() => {
		fetchYakuman(dispatch, props.contestId);
	}, [dispatch, props.contestId]);

	const games = useSelector((state: IState) =>
		Object.values(state.games ?? {})
			.filter(game => game.contestId === props.contestId
				&& game.rounds.find(round => getYakumanAgari(round).length > 0))
	);

	// const rounds = games
	// 	.map(game =>
	// 		game.rounds
	// 			.filter(round => getYakumanAgari(round).length > 0)
	// 			.map<[RoundResult, Rest.GameResult]>(round => [round, game])
	// 	).flat();

	return <>
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Yakuman Attained</u></Col>
		</Row>
		<Row>
			<Container className="rounded bg-dark text-light pt-2 px-3">
				{ games.length > 0 ?
					games.map((game, i) =>
						<Row
							className={`no-gutters align-items-center pb-1 mb-1`}
							key={game._id}
							style={i === games.length - 1 ? {} : {borderBottom: "solid white 1px"}}
						>
							<Col style={{fontSize:"1.5em"}}>
								{ game.rounds.map(getYakumanAgari).filter(agari => agari.length > 0).flat().map(agari => getYakumanName(agari.han)).join(" ") }
							</Col>

							<Col md="auto" className="mr-3">
								{moment(game.start_time).calendar()}
							</Col>

							<Col md="auto">
								<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${game.majsoulId}`} rel="noreferrer" target="_blank">On Majsoul</a>
							</Col>
						</Row>
					)
					:
					<Row className={`no-gutters text-center pb-1 mb-1`}>
						<Col>
							<div className="h4 font-weight-bold m-0">未だ無し</div>
						</Col>
					</Row>
				}
			</Container>
		</Row>
	</>
}

export function ContestPlayerDisplay(props: {
	contestId: string,
	contestPlayer: Rest.ContestPlayer,
	team: string,
	ignoredGames?: number
}): JSX.Element {
	const games = useSelector((state: IState) => {
		if (state.games == null) {
			return [];
		}

		return Object.values(state.games)
			.filter(game => game.contestId === props.contestId
				&& game.players.findIndex(p => p._id === props.contestPlayer._id) >= 0);
	});

	const dispatch = useDispatch();
	const [loadGames, setLoadGames] = React.useState(false);
	React.useEffect(() => {
		if (!loadGames) {
			return;
		}

		fetchContestPlayerGames(dispatch, props.contestId, props.contestPlayer._id);
	}, [props.contestId, props.contestPlayer._id, loadGames]);

	const gamesPlayed = Math.max(0, props.contestPlayer.gamesPlayed - props.ignoredGames);

	return <Accordion as={Container} className="p-0">
		<Accordion.Toggle as={Row} eventKey="0" className="no-gutters align-items-center flex-nowrap" onClick={() => setLoadGames(true)} style={{cursor: "pointer"}}>
			<Col md="auto" style={{minWidth: 50}} className="mr-3 text-right"> <h5><b>{props.contestPlayer.tourneyRank + 1}位</b></h5></Col>
			<TeamIcon team={props.team} seeded={props.contestPlayer.team.seeded}/>
			<Col className="text-nowrap" style={{flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis"}}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold h5 text-truncate"  style={{borderBottom: `3px solid ${gamesPlayed  >= maxGames ? "LightGreen" : "grey" }`}}>
							{props.contestPlayer.nickname}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col md="auto" className="mr-3"> <h5><b>{props.contestPlayer.tourneyScore / 1000}</b></h5></Col>
			<Col md="auto" className="mr-3"> <h5><b>{Math.min(maxGames, gamesPlayed)}戦</b></h5></Col>
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0" >
			<Container>
				{games.sort((a, b) => b.start_time - a.start_time)
					.slice(-(props.ignoredGames ?? 0) - Math.min(maxGames, gamesPlayed), props.ignoredGames ? -props.ignoredGames : undefined)
					.map(game => {
						const playerSeat = game.players.findIndex(p => p._id === props.contestPlayer._id);
						const position = game.finalScore
							.map((score, seat) => ({score, seat}))
							.sort((a, b) => b.score.uma - a.score.uma)
							.findIndex(r => r.seat === playerSeat);
						return <Row key={game._id}>
							<Col md="auto">
								{getSeatCharacter(playerSeat)}
							</Col>

							<Col md="auto">
								{position + 1}位
							</Col>

							<Col>
								{game.finalScore[playerSeat].uma / 1000}
							</Col>

							<Col md="auto">
								{moment(game.start_time).calendar()}
							</Col>

							<Col md="auto">
								<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${game.majsoulId}`} rel="noreferrer" target="_blank">On Majsoul</a>
							</Col>
						</Row>
					})
				}
			</Container>
		</Accordion.Collapse>
	</Accordion>
}

const brackets: Record<string, Array<string>> = {
	"achiga": [
		"Achiga",
		"Shiraitodai",
		"Senriyama",
		"Shindouji",
	],
	"kiyosumi":	[
		"Kiyosumi",
		"Eisui",
		"Miyamori",
		"Himematsu",
	]
}

export function PlayerStandings(props: {contestId: string}): JSX.Element {
	const history = useHistory();
	const hash = useLocation().hash.toLowerCase().substr(1);
	const activeSide = hash in brackets ? hash : "achiga";

	return <Container>
		<Nav
			justify
			variant="tabs"
			activeKey={activeSide}
			className="rounded-top text-light"
			style={{
				backgroundColor: "black"
			}}
			onSelect={(key: string) => {
				history.push({
					hash: `#${key}`,
				})
			}}
		>
			<Nav.Item className="rounded-0">
				<Nav.Link eventKey="achiga" className="h3 m-0 rounded-0" >阿知賀側</Nav.Link>
			</Nav.Item>
			<Nav.Item className="rounded-0">
				<Nav.Link eventKey="kiyosumi" className="h3 m-0 rounded-0">清澄側</Nav.Link>
			</Nav.Item>
			</Nav>
		<BracketPlayerStandings contestId={props.contestId} teams={brackets[activeSide]} ignoredGames={activeSide === "achiga" ? 0 : 4}/>
	</Container>
}

function contestPlayerTeamSort(params: {player: Rest.ContestPlayer<any>, team: string}): number {
	if (params.player.team.seeded && params.team != null) {
		return 1;
	}
	return 0;
}

export function BracketPlayerStandings(props: {
	contestId: string,
	teams: Array<string>,
	ignoredGames?: number
}): JSX.Element {
	const dispatch = useDispatch();
	const [contestPlayers, setContestPlayers] = React.useState<Array<Rest.ContestPlayer<any>>>(null);

	React.useEffect(() => {
		setContestPlayers(null);
		fetchContestPlayersDirect({
			contestId: props.contestId,
			gameLimit: maxGames,
			ignoredGames: props.ignoredGames
		}).then(setContestPlayers);
	}, [props.contestId, props.ignoredGames, props.teams]);

	return <Container className="rounded-bottom bg-dark text-light text-center px-3 py-4">
		{contestPlayers == null
			? <Row>
				<Col>
					<Spinner animation="border" role="status">
						<span className="sr-only">Loading...</span>
					</Spinner>
				</Col>
			</Row>
			: contestPlayers
			.map(player => ({
				player,
				team: props.teams.find(team => player.team.teams.indexOf(team) >= 0)
			}))
			.sort((a, b) => contestPlayerTeamSort(b) - contestPlayerTeamSort(a))
			.map((player, placing) =>
				<Row key={player.player._id} className={`${placing > 0 ? "mt-3" : ""} no-gutters`} style={{maxWidth: 640, margin: "auto"}}>
					<ContestPlayerDisplay contestId={props.contestId} contestPlayer={player.player} team={player.team} ignoredGames={props.ignoredGames}/>
				</Row>
			)
		}
	</Container>
}

export function TourneyContestSummary(props: {contestId: string}): JSX.Element {
	const games = useSelector((state: IState) => {
		if (state.games == null) {
			return [];
		}

		return Object.values(state.games)
			.filter(game => game.contestId === props.contestId)
			.sort((a, b) => b.start_time - a.start_time)
			.slice(0, 4);
	});

	const dispatch = useDispatch();

	React.useEffect(() => {
		fetchGamesHook(dispatch, {
			contestIds: [props.contestId],
			last: 4,
		});
	}, [props.contestId]);

	return <>
		<Row className="mt-3">
			<PlayerStandings contestId={props.contestId} />
		</Row>
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Recent Games</u></Col>
		</Row>
		<Row>
			<Container className="p-0 rounded bg-dark text-light px-1 py-2">
				<Row className="no-gutters">
					{games?.map((game, index) => <React.Fragment key={game._id}>
						<Col style={{minWidth: "auto"}}>
							<GameResultSummary game={game}/>
						</Col>
						{(index % 2 == 1) && <div className="w-100"/>}
					</React.Fragment>)}
				</Row>
			</Container>
		</Row>
	</>
}

export function LeagueContestSummary(props: {contest: Contest}): JSX.Element {
	const games = useSelector((state: IState) => Object.values(state.games ?? [])?.sort((a, b) => b.end_time - a.end_time));
	const musicPlayer = useSelector((state: IState) => state.musicPlayer);
	const dispatch = useDispatch();

	const contest = props.contest;

	const nextSessionIndex = contest?.sessions?.findIndex(session => session.scheduledTime > Date.now()) ?? -1;
	const nextSession = contest?.sessions == null ? null : contest.sessions[nextSessionIndex];
	const currentSession = contest?.sessions == null ? null : contest.sessions[(nextSessionIndex < 1 ? contest.sessions.length : nextSessionIndex) - 1];

	React.useEffect(() => {
		if (nextSession != null || currentSession == null || musicPlayer.playing || contest?.teams == null) {
			return;
		}

		if (games.filter(g => g.start_time > currentSession.scheduledTime).length < 4) {
			return;
		}

		const firstPlace = Object.entries(currentSession.aggregateTotals).map(([teamId, score]) => ({teamId, score})).sort((a, b) => b.score - a.score)[0];
		const anthem = contest.teams[firstPlace.teamId]?.anthem;
		if (anthem == null) {
			return;
		}

		dispatch({
			type: navigator.userAgent.indexOf('Firefox') != -1 ? ActionType.SetMusic : ActionType.PlayMusic,
			videoId: anthem
		});
	}, [nextSession, currentSession, contest?.teams]);

	if (contest == null) {
		return null;
	}

	return <>
		<Row className="mt-3">
			<Teams session={currentSession} />
		</Row>
		<Row className="mt-3">
			<LeagueStandingChart/>
		</Row>
		{ nextSession != null && <>
			<Row className="px-4 py-3 justify-content-end" >
				<Col md="auto" className="h4 mb-0"><u>Next Session</u></Col>
			</Row>
			<Row>
				<Session session={nextSession}></Session>
			</Row>
		</>}
		<Row className="px-4 py-3 justify-content-end" >
			<Col md="auto" className="h4 mb-0"><u>Recent Session</u></Col>
		</Row>
		<Row>
			<Session session={currentSession}></Session>
		</Row>
	</>
}

export function ContestList(): JSX.Element {
	const dispatch = useDispatch();
	React.useEffect(() => {
		fetchContests(dispatch);
	}, [true]);
	const contests = useSelector((state: IState) => Object.values(state.contestsByMajsoulFriendlyId));
	return <Container>
		{contests.map(contest =>
			<Row className="bg-dark rounded text-white" key={contest._id}>
				<Link to={`/contests/${contest.majsoulFriendlyId}`}>
					<h4>{contest.name}</h4>
				</Link>
			</Row>
		)}
	</Container>
}
