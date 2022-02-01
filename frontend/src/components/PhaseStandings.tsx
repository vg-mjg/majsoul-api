import * as React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { fetchActivePhase } from "src/api/Contests";
import { IndividualPlayerStandings, IndividualPlayerStandingsProps } from "./IndividualPlayerStandings";
import { ContestContext } from "./Contest/ContestProvider";
import Accordion from "react-bootstrap/Accordion";
import { ArrowToggle } from "./utils/ArrowToggle";
import { TabNavigator } from "./TabNavigator";
import { TourneyContestPhaseSubtype, TourneyContestScoringType } from "majsoul-api/dist/store/types";
import { useHistory, useLocation } from "react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { IState } from "../State";
import { PlayerRankingType, PlayerTourneyStandingInformation, TourneyPhase } from "majsoul-api/dist/rest/types/types";

interface TypeGroup {
	type: TourneyContestScoringType;
	standings: IndividualPlayerStandingsProps[];
};

function groupByType(standings: IndividualPlayerStandingsProps[]): TypeGroup[] {
	const groups: TypeGroup[] = [];

	for(const standing of standings) {
		if (standing.qualificationType !== groups[0]?.type) {
			groups.unshift({
				type: standing.qualificationType,
				standings: []
			});
		}
		groups[0].standings.push(standing);
	}

	return groups.reverse();
}

const GroupedStandingsSection: React.FC<{
	previousItem?: PlayerTourneyStandingInformation;
	standings: IndividualPlayerStandingsProps[];
	scoreType: TourneyContestScoringType;
}>= ({previousItem, standings, scoreType}) => {
	const { t } = useTranslation();

	const groups = groupByType(standings);
	if (scoreType == null) {
		return <>
			{groups.map((group, index) => <React.Fragment key={index}>
				{ (index !== 0 || previousItem?.qualificationType !== group.type)
						&& <div className="h4 mt-2 mb-3">{t(`tourney.scoreType.${TourneyContestScoringType[group.type].toLowerCase()}`)}</div> }
					<StandingsSection standings={group.standings} scoreType={scoreType}/>
				</React.Fragment>
			)}
		</>;
	}

	return <StandingsSection standings={standings} scoreType={scoreType}/>;
}

const StandingsSection: React.FC<{
	standings: IndividualPlayerStandingsProps[];
	scoreType: TourneyContestScoringType;
}>= ({standings, scoreType}) => {
	return <>
		{standings
			.map((data, index) => <Row key={data.player._id} className={`mt-3 no-gutters`} style={{ maxWidth: 640, margin: "auto" }}>
				<IndividualPlayerStandings {...data} scoreType={scoreType} />
			</Row>
			)}
	</>;
}

const ScoreRankingDisplay: React.FC<{
	standings: PlayerTourneyStandingInformation[],
	team?: string,
}> = (props) => {
	const [showMore, setShowMore] = React.useState(false);
	const { t } = useTranslation();
	const history = useHistory();

	const hash = useLocation().hash.toLowerCase().substr(1);
	const selectedScoreType = contestTypeValues[hash];

	const standings = React.useMemo<IndividualPlayerStandingsProps[]>(() => {
		if (!props.standings) {
			return null;
		}

		const standings = props.standings.map(standing => ({
			...standing,
			scoreRanking: standing.rankingDetails.type === PlayerRankingType.Score
				? standing.rankingDetails?.details
				: standing.rankingDetails.details[props.team]?.scoreRanking?.details
		})).filter(standing => standing.scoreRanking);

		if (selectedScoreType == null) {
			return standings;
		}

		return standings.sort((a, b) => a.scoreRanking[selectedScoreType].rank - b.scoreRanking[selectedScoreType].rank);
	}, [props.standings, selectedScoreType, props.team]);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setShowMore(accordionKey === "0");
	}, [setShowMore]);

	const topStandings = standings.slice(0, 32);
	const otherStandings = standings.slice(32);

	const contestScoreTypes = Object.keys(standings?.[0]?.rankingDetails?.details ?? {});

	return <>
		<Accordion
			as={Container}
			className={clsx("rounded-bottom bg-dark text-light text-center px-3 pb-2", contestScoreTypes.length <= 1 && "pt-2")}
			onSelect={onAccordionSelect}
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
											key: TourneyContestScoringType[parseInt(scoreType) as TourneyContestScoringType].toLowerCase(),
											title: t(`tourney.scoreType.${TourneyContestScoringType[parseInt(scoreType) as TourneyContestScoringType].toLowerCase()}`),
									}))
							]
							}
							onTabChanged={(key) => {
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
			<GroupedStandingsSection standings={topStandings} scoreType={selectedScoreType}/>
			<Accordion.Collapse eventKey="0">
				<>
					{showMore &&  <GroupedStandingsSection standings={otherStandings} previousItem={topStandings[topStandings.length - 1]} scoreType={selectedScoreType}/>}
				</>
			</Accordion.Collapse>
			<Accordion.Toggle as={Row} eventKey="0" className="pt-1">
				<ArrowToggle pointUp={showMore}/>
			</Accordion.Toggle>
		</Accordion>
	</>;
}

const TeamRankingDisplay: React.FC<{
	phase: TourneyPhase
}> = (props) => {
	const { contestId } = React.useContext(ContestContext);
	const teams = useSelector((state: IState) => {
		const contest = state.contestsById[contestId];
		if (!contest?.teams) {
			return [];
		}
		return Object.values(contest.teams);
	});
	const [selectedTeam, setSelectedTeam] = React.useState<string>(null);
	return <>
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
		{ selectedTeam && <ScoreRankingDisplay standings={props.phase.standings} team={selectedTeam} />}
	</>
}

const contestTypeValues =
	Object.values(TourneyContestScoringType)
		.filter(value => !isNaN(value as any))
		.reduce((total, next: TourneyContestScoringType) => {
			total[TourneyContestScoringType[next].toLowerCase()] = next as TourneyContestScoringType
			return total
		}, {} as  Record<string, TourneyContestScoringType>);

export const PhaseStandings: React.FC = () => {
	const [phase, setPhase] = React.useState<TourneyPhase>(null);
	const { contestId } = React.useContext(ContestContext);

	React.useEffect(() => {
		setPhase(null);
		fetchActivePhase(contestId).then(setPhase);
	}, [contestId]);

	if (!phase) {
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

	if (phase.subtype === TourneyContestPhaseSubtype.TeamQualifier) {
		return <TeamRankingDisplay phase={phase} />;
	}

	return <ScoreRankingDisplay standings={phase.standings} />;
}
