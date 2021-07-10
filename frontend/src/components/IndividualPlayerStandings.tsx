import * as React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Rest } from "majsoul-api";
import Accordion from "react-bootstrap/Accordion";
import { getSeatCharacter } from "./GameResultSummary";
import { fetchContestPlayerGames } from "src/api/Games";
import * as dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { PlayerTourneyStandingInformation } from "../../../api/dist/rest";
import clsx from "clsx";
import Badge from "react-bootstrap/Badge";

export enum PlayerZone {
	Unknown,
	China,
	Japan,
	Other
}

interface IndividualPlayerStandingsProps extends PlayerTourneyStandingInformation {
	contestId: string
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

export function IndividualPlayerStandings(props: IndividualPlayerStandingsProps): JSX.Element {
	const { t } = useTranslation();

	const [games, setGames] = React.useState<Rest.GameResult[]>([])

	const [loadGames, setLoadGames] = React.useState(false);
	React.useEffect(() => {
		if (!loadGames) {
			return;
		}
		setGames([]);
		fetchContestPlayerGames(props.contestId, props.player._id)
			.then(setGames);
	}, [props.contestId, props.player._id, loadGames]);

	return <Accordion as={Container} className="p-0">
		<Accordion.Toggle as={Row} eventKey="0" className="no-gutters align-items-center flex-nowrap" onClick={() => setLoadGames(true)} style={{ cursor: "pointer" }}>
			<Col md="auto" style={{ minWidth: 50 }} className="mr-3 text-right"> <h5><b>{props.rank}位</b></h5></Col>
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
			<Col md="auto" className="mr-3"> <h5><b>{props.score / 1000}</b></h5></Col>
			<Col md="auto" className="mr-3"> <h5><b>{props.totalMatches}戦</b></h5></Col>
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<Container>
				{games.sort((a, b) => b.start_time - a.start_time)
					.map(game => {
						const playerSeat = game.players.findIndex(p => p?._id === props.player._id);
						const position = game.finalScore
							.map((score, seat) => ({ score, seat }))
							.sort((a, b) => b.score.uma - a.score.uma)
							.findIndex(r => r.seat === playerSeat);
						return <Row key={game._id} className={clsx(props.highlightedGameIds?.indexOf(game._id) >= 0 && "font-weight-bold")}>
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
			</Container>
		</Accordion.Collapse>
	</Accordion>;
}
