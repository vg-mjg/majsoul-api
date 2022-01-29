import * as React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Rest, Store } from "majsoul-api";
import Accordion from "react-bootstrap/Accordion";
import { getSeatCharacter } from "./GameResultSummary";
import { fetchContestPlayerGames } from "src/api/Games";
import * as dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { PlayerTourneyStandingInformation } from "../../../api/dist/rest";
import clsx from "clsx";
import Badge from "react-bootstrap/Badge";
import { PlayerZone } from "majsoul-api/dist/majsoul/types";
import { Stats } from "./Stats/Stats";
import { useContext } from "react";
import { ContestContext } from "./Contest/ContestProvider";
import * as globalStyles from "./styles.sass";
import { TourneyContestType } from "majsoul-api/dist/store/types";
import { useSelector } from "react-redux";
import { IState } from "../State";

interface IndividualPlayerStandingsProps extends PlayerTourneyStandingInformation {
	scoreType?: TourneyContestType,
}

const zoneMap: Record<PlayerZone, {
	color: string,
	name: string,
}> = {
	[PlayerZone.China]: {
		name: "中国",
		color: "#fece1b"
	},
	[PlayerZone.Japan]: {
		name: "日本",
		color: "#bd0029"
	},
	[PlayerZone.Other]: {
		name: "世界",
		color: "#3f90df"
	},
	[PlayerZone.Unknown]: {
		name: "不明",
		color: "#000000"
	}
}

const Zone: React.FC<{
	zone: PlayerZone
}> = ({ zone }) => {
	if (zone === PlayerZone.Unknown) {
		return null;
	}

	const { name, color } = zoneMap[zone];
	return <h4 className="pr-2 text-dark">
		<Badge style={{
			backgroundColor: color,
			color: "white"
		}}>
			{name}
		</Badge>
	</h4>
}


export function TeamIcon(props: {
	team: Store.ContestTeam
}): JSX.Element {
	return <h4 className="pr-2 text-dark">
		<Badge style={{
			backgroundColor: `#${props.team.color}`,
			color: props.team.contrastBadgeFont ? undefined : "white"
		}}>
			{props.team.name}
		</Badge>
	</h4>
}


export function IndividualPlayerStandings(props: IndividualPlayerStandingsProps): JSX.Element {
	const { t } = useTranslation();

	const { contestId } = useContext(ContestContext);

	const contest = useSelector((state: IState) => state.contestsById[contestId]);
	console.log(props.player._id);
	const team = contest?.teams != null
		? Object.values(contest.teams).find(team => team?.players?.find(player => player._id === props.player._id))
		: null;

	const [games, setGames] = React.useState<Rest.GameResult[]>([])
	const [viewDetails, setViewDetails] = React.useState(false);

	const [loadGames, setLoadGames] = React.useState(false);
	React.useEffect(() => {
		if (!loadGames) {
			return;
		}
		setGames([]);
		fetchContestPlayerGames(contestId, props.player._id)
			.then(setGames);
	}, [contestId, props.player._id, loadGames]);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setViewDetails(accordionKey === "0");
	}, [setViewDetails]);

	return <Accordion as={Container} className="p-0" activeKey={viewDetails ? "0" : null} onSelect={onAccordionSelect} >
		<Accordion.Toggle
			as={Row}
			eventKey="0"
			className={clsx("no-gutters align-items-center flex-nowrap", globalStyles.linkDark)}
			onClick={() => setLoadGames(true)}
			style={{ cursor: "pointer" }}
		>
			<Col md="auto" style={{ minWidth: 50 }} className="mr-3 text-right"> <h5><b>{props.scoreType == null ? props.rank : props.scores[props.scoreType].rank}位</b></h5></Col>
			{team && <TeamIcon team={team} />}
			<Zone zone={props.player.zone} />
			<Col className="text-nowrap" style={{ flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold h5 text-truncate" style={{ borderBottom: `3px solid ${props.hasMetRequirements ? "LightGreen" : "grey"}` }}>
							{props.player.nickname}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col md="auto" className="mr-3"> <h5><b>{props.scores[props.scoreType ?? props.qualificationType].score / 1000}</b></h5></Col>
			<Col md="auto" className="mr-3"> <h5><b>{props.totalMatches}戦</b></h5></Col>
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<>
				{ viewDetails && <Container>
					<Row>
						<Stats
							request={{player: props.player._id}}
						/>
					</Row>
					{games.sort((a, b) => b.start_time - a.start_time)
						.map(game => {
							const playerSeat = game.players.findIndex(p => p?._id === props.player._id);
							const position = game.finalScore
								.map((score, seat) => ({ score, seat }))
								.sort((a, b) => b.score.uma - a.score.uma)
								.findIndex(r => r.seat === playerSeat);
							return <Row key={game._id} className={clsx(props.scores[props.scoreType ?? props.qualificationType].highlightedGameIds?.indexOf(game._id) >= 0 && "font-weight-bold")}>
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
									{dayjs(game.start_time).calendar()}
								</Col>

								<Col md="auto">
									<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${game.majsoulId}`} rel="noreferrer" target="_blank">{t("viewOnMajsoul")}</a>
								</Col>
							</Row>;
						})}
				</Container>}
			</>
		</Accordion.Collapse>
	</Accordion>;
}
