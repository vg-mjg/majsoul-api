import type { Rest } from "backend";
import { PlayerRankingType } from "backend/dist/rest/enums.js";
import { TourneyContestPhaseSubtype, TourneyContestScoringType } from "backend/dist/store/enums.js";
import clsx from "clsx";
import * as React from "react";
import Accordion from "react-bootstrap/Accordion";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Spinner from "react-bootstrap/Spinner";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router";

import { IState } from "../State";
import { ContestContext } from "./contest/ContestProvider";
import { IndividualPlayerStandings, IndividualPlayerStandingsProps } from "./IndividualPlayerStandings";
import { TabNavigator } from "./TabNavigator";
import { Teams } from "./Teams";
import { ArrowToggle } from "./utils/ArrowToggle";

interface TypeGroup {
	type: Rest.TourneyContestScoringDetailsWithId;
	standings: IndividualPlayerStandingsProps[];
}

function groupByType(
	standings: IndividualPlayerStandingsProps[],
	scoreTypes: Record<string, Rest.TourneyContestScoringDetailsWithId>,
): TypeGroup[] {
	const groups: TypeGroup[] = [];

	for(const standing of standings) {
		if (standing.qualificationType !== groups[0]?.type.id) {
			const qualificationType = scoreTypes[standing.qualificationType];
			groups.unshift({
				type: qualificationType,
				standings: []
			});
		}
		groups[0].standings.push(standing);
	}

	return groups.reverse();
}

const GroupedStandingsSection: React.FC<{
	previousItem?: Rest.PlayerTourneyStandingInformation;
	standings: IndividualPlayerStandingsProps[];
	scoreTypeId: string;
	scoreTypes: Record<string, Rest.TourneyContestScoringDetailsWithId>;
}>= ({previousItem, standings, scoreTypeId, scoreTypes}) => {
	const { t } = useTranslation();

	const groups = groupByType(standings, scoreTypes);
	if (scoreTypeId == null) {
		return <>
			{groups.map((group, index) => <React.Fragment key={index}>
				{ (index !== 0 || scoreTypes[previousItem?.qualificationType]?.type !== group.type.type)
						&& <div className="h4 mt-2 mb-3">{t(getScoreTitleKey(group.type))}</div> }
				<StandingsSection standings={group.standings} scoreTypes={scoreTypes} scoreTypeId={scoreTypeId} />
			</React.Fragment>
			)}
		</>;
	}

	return <StandingsSection standings={standings} scoreTypeId={scoreTypeId} scoreTypes={scoreTypes} />;
};

const StandingsSection: React.FC<{
	standings: IndividualPlayerStandingsProps[];
	scoreTypeId: string;
	scoreTypes: Record<string, Rest.TourneyContestScoringDetailsWithId>;
}>= ({standings, scoreTypes, scoreTypeId}) => {
	return <>
		{standings
			.map((data) => <Row key={data.player._id} className={"mt-3 no-gutters"} style={{ maxWidth: 640, margin: "auto" }}>
				<IndividualPlayerStandings {...data} scoreTypeId={scoreTypeId} scoreTypes={scoreTypes} />
			</Row>
			)}
	</>;
};

const ScoreRankingDisplay: React.FC<{
	standings: Rest.PlayerTourneyStandingInformation[];
	scoreTypes: Record<string, Rest.TourneyContestScoringDetailsWithId>;
	team?: string;
}> = (props) => {
	const [showMore, setShowMore] = React.useState(false);
	const { t } = useTranslation();
	const history = useHistory();

	const hash = useLocation().hash.toLowerCase().slice(1);
	const selectedScoreTypeId = props.scoreTypes[hash]?.id;

	const standings = React.useMemo<IndividualPlayerStandingsProps[]>(() => {
		if (!props.standings) {
			return null;
		}

		const standings = props.standings.map(standing => ({
			...standing,
			rank: standing.rankingDetails.type === PlayerRankingType.Score
				? standing.rank
				: standing.rankingDetails.details?.[props.team]?.rank,
			qualificationType: standing.rankingDetails.type === PlayerRankingType.Score
				? standing.qualificationType
				: standing.rankingDetails.details?.[props.team]?.qualificationType,
			scoreRanking: standing.rankingDetails.type === PlayerRankingType.Score
				? standing.rankingDetails?.details
				: standing.rankingDetails.details[props.team]?.scoreRanking?.details
		})).filter(standing => standing.scoreRanking);

		if (selectedScoreTypeId == null) {
			return standings.sort((a, b) => a.rank - b.rank);
		}

		return standings.sort((a, b) => a.scoreRanking[selectedScoreTypeId].rank - b.scoreRanking[selectedScoreTypeId].rank);
	}, [props.standings, selectedScoreTypeId, props.team]);

	const topStandings = standings.slice(0, 32);
	const otherStandings = standings.slice(32);

	const contestScoreTypes = Object.values(props.scoreTypes);

	return <>
		<Accordion
			as={Container}
			className={clsx("rounded-bottom bg-dark text-light text-center px-3 pb-2", contestScoreTypes.length <= 1 && "pt-2")}
			activeKey={showMore ? "0" : null}
		>
			{contestScoreTypes.length > 1 &&
				<Row>
					<Col className="p-0 overflow-hidden rounded">
						<TabNavigator
							tabs={
								[
									{
										key: "combined",
										title: t("tourney.scoreType.combined"),
									},
									...contestScoreTypes.map(scoreType => ({
										key: scoreType.id,
										title: t(getScoreTitleKey(scoreType))
									}))
								]
							}
							onTabChanged={(key) => {
								setShowMore(false);
								history.push({
									hash: `#${key}`,
								});
							}}
							activeTab={hash.length === 0 ? null :  hash}
							defaultTab={"combined"}
						/>
					</Col>
				</Row>
			}
			<GroupedStandingsSection standings={topStandings} scoreTypeId={selectedScoreTypeId} scoreTypes={props.scoreTypes} />
			<Accordion.Collapse eventKey="0">
				<>
					{showMore && <GroupedStandingsSection
						standings={otherStandings}
						previousItem={topStandings[topStandings.length - 1]}
						scoreTypeId={selectedScoreTypeId}
						scoreTypes={props.scoreTypes}
					/>}
				</>
			</Accordion.Collapse>
			{ otherStandings.length > 0 &&
				<Accordion.Toggle as={Row} eventKey="0" className="pt-1" onClick={() => setShowMore(!showMore)} >
					<ArrowToggle pointUp={showMore}/>
				</Accordion.Toggle>
			}
		</Accordion>
	</>;
};

const TeamRankingDisplay: React.FC<{
	phase: Rest.TourneyPhase;
	scoreTypes: Record<string, Rest.TourneyContestScoringDetailsWithId>;
}> = (props) => {
	const { contestId } = React.useContext(ContestContext);

	const { t } = useTranslation();

	const contest = useSelector((state: IState) => state.contestsById[contestId]);
	const teamsById = contest?.teams;

	const teams = [
		{
			_id: "allPlayers",
			name: t("tourney.allPlayers"),
		},
		...(teamsById == null ? [] : Object.values(teamsById))
	];

	const showTeams = contest.subtype === TourneyContestPhaseSubtype.TeamQualifier;

	const teamScores = props.phase.standings.reduce(
		(total, standing) => {
			if (standing.rankingDetails.type !== PlayerRankingType.Team) {
				return total;
			}

			for (const teamId in standing.rankingDetails.details) {
				const teamDetail = standing.rankingDetails.details[teamId];
				const score = teamDetail.scoreRanking.details[TourneyContestScoringType.Cumulative]?.score;

				if (score == null) {
					return total;
				}

				if (!(teamId in total)) {
					total[teamId] = 0;
				}

				total[teamId] += score;
			}
			return total;
		},
		{} as Record<string, number>
	);

	const [selectedTeam, setSelectedTeam] = React.useState<string>("allPlayers");

	return <>
		<Container className="p-0 overflow-hidden rounded-top">
			{ showTeams
				&& <Row className="no-gutters mb-3">
					<Teams
						teamScores={teamScores}
					/>
				</Row>
			}
			<Row className="no-gutters">
				<Col>
					<TabNavigator
						tabs={
							teams.map(team => ({
								key: team._id,
								title: team.name,
							}))
						}
						onTabChanged={(key) => {
							setSelectedTeam(key);
						}}
						activeTab={selectedTeam}
					/>
				</Col>
			</Row>
		</Container>
		{ selectedTeam && <ScoreRankingDisplay standings={props.phase.standings} team={selectedTeam === "allPlayers" ? null : selectedTeam} scoreTypes={props.scoreTypes} />}
	</>;
};

export const PhaseStandings: React.FC<{phase: Rest.TourneyPhase, isLoading: boolean}>= ({phase, isLoading}) => {
	if (!phase || isLoading) {
		return <Container className="rounded-bottom bg-dark text-light text-center px-3 py-4">
			<Row>
				<Col>
					<Spinner animation="border" role="status">
						<span className="sr-only">Loading...</span>
					</Spinner>
				</Col>
			</Row>
		</Container>;
	}

	const scoreTypes = phase.scoringTypes?.reduce(
		(total, next) => (total[next.id] = next, total),
		{} as Record<string, Rest.TourneyContestScoringDetailsWithId>
	) ?? {};

	if (phase.subtype === TourneyContestPhaseSubtype.TeamQualifier) {
		return <TeamRankingDisplay phase={phase} scoreTypes={scoreTypes} />;
	}

	return <ScoreRankingDisplay standings={phase.standings} scoreTypes={scoreTypes} />;
};

function getScoreTitleKey(scoreType: Rest.TourneyContestScoringDetailsWithId): string {
	const typeKey = `tourney.scoreType.${TourneyContestScoringType[scoreType.type].toLowerCase()}`;
	if (scoreType.type === TourneyContestScoringType.Consecutive) {
		return `${typeKey}.${scoreType.typeDetails?.findWorst ? "worst" : "best"}`;
	}
	return typeKey;
}

