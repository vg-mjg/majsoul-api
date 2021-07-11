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

const StandingsSection: React.FC<{
	standings: Rest.PlayerTourneyStandingInformation[]
}>= ({standings}) => {
	return <>
		{standings
			.map((data, index) => <Row key={data.player._id} className={`mt-3 no-gutters`} style={{ maxWidth: 640, margin: "auto" }}>
				<IndividualPlayerStandings {...data} />
			</Row>
			)}
	</>;
}

export const PhaseStandings: React.FC = () => {
	const [phase, setPhase] = React.useState<Rest.TourneyPhase>(null);
	const [showMore, setShowMore] = React.useState(false);


	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setShowMore(accordionKey === "0");
	}, [setShowMore]);

	const { contestId } = React.useContext(ContestContext);

	React.useEffect(() => {
		setPhase(null);
		fetchActivePhase(contestId).then(setPhase);
	}, [contestId]);

	if (!phase?.standings) {
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

	const topStandings = phase.standings.slice(0, 32);
	const otherStandings = phase.standings.slice(32);

	return <Accordion
		as={Container}
		className="rounded-bottom bg-dark text-light text-center px-3 pt-2 pb-2"
		onSelect={onAccordionSelect}
		activeKey={showMore ? "0" : null}
	>
		<StandingsSection standings={topStandings}/>
		<Accordion.Collapse eventKey="0">
			<>
				{showMore && <StandingsSection standings={otherStandings}/>}
			</>
		</Accordion.Collapse>
		<Accordion.Toggle as={Row} eventKey="0" className="pt-1">
			<ArrowToggle pointUp={showMore}/>
		</Accordion.Toggle>
	</Accordion>
}
