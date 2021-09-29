import * as React from "react";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner';
import { Rest } from "majsoul-api";
import { fetchActivePhase } from "src/api/Contests";
import { IndividualPlayerStandings } from "./IndividualPlayerStandings";
import { ContestContext } from "./Contest/ContestProvider";
import Accordion from "react-bootstrap/Accordion";
import { ArrowToggle } from "./utils/ArrowToggle";
import { TabNavigator } from "./TabNavigator";
import { TourneyContestType } from "majsoul-api/dist/store/types";
import { useHistory, useLocation } from "react-router";
import clsx from "clsx";

const StandingsSection: React.FC<{
	standings: Rest.PlayerTourneyStandingInformation[],
	scoreType?: TourneyContestType,
}>= ({standings, scoreType}) => {
	return <>
		{standings
			.map((data, index) => <Row key={data.player._id} className={`mt-3 no-gutters`} style={{ maxWidth: 640, margin: "auto" }}>
				<IndividualPlayerStandings {...data} scoreType={scoreType} />
			</Row>
			)}
	</>;
}

const contestTypeValues =
	Object.values(TourneyContestType)
		.filter(value => !isNaN(value as any))
		.reduce((total, next: TourneyContestType) => {
			total[TourneyContestType[next].toLowerCase()] = next as TourneyContestType
			return total
		}, {} as  Record<string, TourneyContestType>);

export const PhaseStandings: React.FC = () => {
	const [phase, setPhase] = React.useState<Rest.TourneyPhase>(null);
	const [showMore, setShowMore] = React.useState(false);

	const history = useHistory();
	const hash = useLocation().hash.toLowerCase().substr(1);
	const selectedScoreType = contestTypeValues[hash];

	const standings = React.useMemo(() => {
		if (!phase?.standings) {
			return null;
		}

		if (selectedScoreType == null) {
			return phase.standings;
		}

		return [...phase.standings].sort((a, b) => a.scores[selectedScoreType].rank - b.scores[selectedScoreType].rank);
	}, [phase?.standings, selectedScoreType]);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setShowMore(accordionKey === "0");
	}, [setShowMore]);

	const { contestId } = React.useContext(ContestContext);

	React.useEffect(() => {
		setPhase(null);
		fetchActivePhase(contestId).then(setPhase);
	}, [contestId]);

	if (!standings) {
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

	const topStandings = standings.slice(0, 32);
	const otherStandings = standings.slice(32);

	const contestScoreTypes = Object.keys(standings?.[0]?.scores ?? {});

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
										title: "Combined Score",
									},
									...contestScoreTypes.map(scoreType => ({
											key: TourneyContestType[parseInt(scoreType) as TourneyContestType].toLowerCase(),
											title: TourneyContestType[parseInt(scoreType) as TourneyContestType],
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
			<StandingsSection standings={topStandings} scoreType={selectedScoreType}/>
			<Accordion.Collapse eventKey="0">
				<>
					{showMore && <StandingsSection standings={otherStandings} scoreType={selectedScoreType}/>}
				</>
			</Accordion.Collapse>
			<Accordion.Toggle as={Row} eventKey="0" className="pt-1">
				<ArrowToggle pointUp={showMore}/>
			</Accordion.Toggle>
		</Accordion>
	</>
}
