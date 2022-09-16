import { stylesheet } from "astroturf";
import type { Rest, Store } from "backend";
import { StyleComboType, StyleMeterChangeType, StyleMoveType, StylePenaltyType, TourneyContestScoringType, Wind } from "backend/dist/store/enums.js";
import clsx from "clsx";
import * as dayjs from "dayjs";
import { PlayerZone } from "majsoul/dist/enums.js";
import * as React from "react";
import { useContext } from "react";
import Accordion from "react-bootstrap/Accordion";
import Badge from "react-bootstrap/Badge";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { fetchContestPlayerGames } from "../api/Games";
import { IState } from "../State";
import { ContestContext } from "./contest/ContestProvider";
import { getSeatCharacter } from "./GameResultSummary";
import { PaipuLink } from "./PaipuLink";
import { Stats } from "./Stats/Stats";
import globalStyles from "./styles.sass";

export interface IndividualPlayerStandingsProps extends Rest.PlayerTourneyStandingInformation {
	scoreRanking?: Rest.PlayerScoreTypeRanking["details"];
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
};

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
	</h4>;
};


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
	</h4>;
}


const styles = stylesheet`
	.gacha {
		display: inline-flex;
	}

	.gachaGroup {
		display: inline-flex;
		margin-left: 12px;
		align-items: center;
	}

	.gachaIconContainer {
		width: 16px;
	}

	.gachaNumber {
		display: inline;
		font-size: 16px;
	}

	.gachaIcon {
		width: 24px;
		height: 24px;
	}

	.gachaImageContainer {
		display: flex;
		flex: 1;
		justify-content: center;
	}

	.gachaImage {
		border-radius: 32px;
		width: 512px;
		height: 512px;
		margin: 32px;
	}

	.styledGame {
		&:hover {
			text-decoration: underline;
		}

		cursor: pointer;
	}

	.moveRow {
		background-color: #2f343a;
	}

	.penaltyRow {
		background-color: #403440;
	}

	.comboDownRow {
		background-color: #403a34;
	}

	.comboUpRow {
		background-color: #344034;
	}
`;

const GachaIcon: React.FC<{cardId: string}> = ({cardId}) => {
	const { contestId } = useContext(ContestContext);
	const contest = useSelector((state: IState) => state.contestsById[contestId]);
	const card = contest.gacha.groups.map(group => group.cards).flat().find(card => card._id === cardId);

	if (!card) {
		return null;
	}

	return <div className={styles.gachaIconContainer}>
		<img src={card.icon} className={styles.gachaIcon} />
	</div>;
};

const GachaGroup: React.FC<{group: Rest.GachaData}> = ({group}) => {
	return <div className={styles.gachaGroup}>
		{group.cards.slice(0, 10).filter(card => !!card).map((card, index) => <GachaIcon key={`${card}-${index}`} cardId={card} />)}
		{group.cards.length > 10 && <div className={styles.gachaNumber}>x{group.cards.length}</div>}
	</div>;
};

const GachaImage: React.FC<{gachaData: Rest.GachaData[]}> = ({gachaData}) => {
	const { contestId } = useContext(ContestContext);
	const contest = useSelector((state: IState) => state.contestsById[contestId]);
	const cardMap = contest.gacha.groups.reduce(
		(total, next) => (
			next.cards.reduce((total, next) => (total[next._id] = next, total), total), total
		),
		{} as Record<string, Store.GachaCard>
	);

	const card = gachaData.map(data => data.cards).flat().find(card => cardMap[card].image);

	if (!card) {
		return null;
	}

	return <Row>
		<div className={styles.gachaImageContainer}>
			<img src={cardMap[card].image} className={styles.gachaImage} />
		</div>
	</Row>;
};

const GameDetails: React.FC<{
	playerSeat: Wind;
	position: number;
	score: number;
	startTime: number;
	majsoulId: string;
	styleBreakdown?: Store.StyleBreakdown
}> = ({
	playerSeat,
	position,
	score,
	startTime,
	majsoulId,
	styleBreakdown,
}) => {
	const { t } = useTranslation();
	const [viewDetails, setViewDetails] = React.useState(false);
	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setViewDetails(accordionKey === "0");
	}, [setViewDetails]);

	return <Accordion as={Container} activeKey={viewDetails ? "0" : null} onSelect={onAccordionSelect} className={clsx(styles && styles.styledGame)}>
		<Accordion.Toggle as={Row} eventKey="0">
			<Col md="auto">
				{getSeatCharacter(playerSeat)}
			</Col>

			<Col md="auto">
				{position + 1}位
			</Col>

			<Col md="auto">
				{styleBreakdown?.total ?? score}
			</Col>

			<Col>
				{dayjs(startTime).calendar()}
			</Col>

			<Col md="auto">
				<PaipuLink majsoulId={majsoulId} />
			</Col>
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<Container>
				{styleBreakdown.moves.map((style, index) => <Row
					key={`${index}_${style.type}`}
					className={clsx(
						style.type === StyleMeterChangeType.Move && styles.moveRow,
						style.type === StyleMeterChangeType.Penalty && styles.penaltyRow,
						style.type === StyleMeterChangeType.Combo && (style.change >= 0 ? styles.comboUpRow : styles.comboDownRow),
					)}
				>
					<Col className="text-left">{t(`sss.moves.${
						style.type === StyleMeterChangeType.Move
							? StyleMoveType[style.moveType]
							: style.type === StyleMeterChangeType.Combo
								? StyleComboType[style.comboType]
								: StylePenaltyType[style.penaltyType]
					}`)}</Col>
					<Col className="text-right">{style.type === StyleMeterChangeType.Move
						? style.actualPoints
						: style.type === StyleMeterChangeType.Combo
							? style.change
							: style.points
					}</Col>
				</Row>)}
			</Container>
		</Accordion.Collapse>
	</Accordion>;
};

export function IndividualPlayerStandings(props: IndividualPlayerStandingsProps & {
	scoreTypes: Record<string, Rest.TourneyContestScoringDetailsWithId>;
	scoreTypeId: string;
}): JSX.Element {
	const { contestId } = useContext(ContestContext);

	const contest = useSelector((state: IState) => state.contestsById[contestId]);
	const team = contest?.teams != null
		? Object.values(contest.teams).find(team => team?.players?.find(player => player._id === props.player._id))
		: null;

	const [games, setGames] = React.useState<Rest.GameResult[]>([]);
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

	const selectedScoreTypeId = props.scoreTypeId ?? props.qualificationType;
	const selectedScoreType = props.scoreTypes[selectedScoreTypeId];

	return <Accordion as={Container} className="p-0" activeKey={viewDetails ? "0" : null} onSelect={onAccordionSelect} >
		<Accordion.Toggle
			as={Row}
			eventKey="0"
			className={clsx("no-gutters align-items-center flex-nowrap", globalStyles.linkDark)}
			onClick={() => setLoadGames(true)}
			style={{ cursor: "pointer" }}
		>
			<Col md="auto" style={{ minWidth: 50 }} className="mr-3 text-right"> <h5><b>{props.scoreTypeId == null ? props.rank : props.scoreRanking[props.scoreTypeId].rank}位</b></h5></Col>
			{team && <TeamIcon team={team} />}
			<Zone zone={props.player.zone} />
			<Col className="text-nowrap" style={{ flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold h5 text-truncate" style={{ borderBottom: `3px solid ${props.hasMetRequirements ? "LightGreen" : "grey"}` }}>
							{props.player.nickname}
						</Col>
						{
							selectedScoreType.type === TourneyContestScoringType.Gacha &&
								<Col md="auto">
									<div className={styles.gacha}> {props.scoreRanking[selectedScoreType.id].gachaData.map(group => <GachaGroup key={group.name} group={group}/>)}</div>
								</Col>
						}
					</Row>
				</Container>
			</Col>
			<Col md="auto" className="mr-3"> <h5><b>
				{props.scoreRanking[selectedScoreType.id].score / (selectedScoreType.type === TourneyContestScoringType.Kans ? 1 : 1000)}
				{selectedScoreType.type === TourneyContestScoringType.Kans && "槓"}
			</b></h5></Col>
			<Col md="auto" className="mr-3"> <h5><b>{props.totalMatches}戦</b></h5></Col>
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<>
				{ viewDetails && <Container>
					{
						selectedScoreType.type === TourneyContestScoringType.Gacha &&
							<GachaImage gachaData={props.scoreRanking[selectedScoreType.id].gachaData} />
					}
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
							return <Row key={game._id} className={clsx(props.scoreRanking[selectedScoreType.id].highlightedGameIds?.indexOf(game._id) >= 0 && "font-weight-bold")}>
								<Col>
									<GameDetails
										majsoulId={game.majsoulId}
										playerSeat={playerSeat}
										score={game.finalScore[playerSeat].uma / 1000}
										startTime={game.start_time}
										position={position}
										styleBreakdown={game.styles[playerSeat]}
									/>
								</Col>
							</Row>;
						})}
				</Container>}
			</>
		</Accordion.Collapse>
	</Accordion>;
}
