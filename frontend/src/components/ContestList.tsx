import * as React from "react";
import { fetchConfig, fetchContests, putContest, updateConfig } from "../actions/Actions";
import { IState } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import { useCallback } from "react";
import { contestName } from "./utils";
import Form from "react-bootstrap/Form";

export function ContestList(): JSX.Element {
	const dispatch = useDispatch();
	const token = useSelector((state: IState) => state.user?.token);
	const [featuredContest, setFeaturedContest] = React.useState<string>(undefined);
	const addContestFunc = useCallback(() => putContest(dispatch, token), [dispatch, token]);

	React.useEffect(() => {
		fetchContests(dispatch);
		fetchConfig(dispatch).then((config) => setFeaturedContest(config.featuredContest ?? ""));
	}, [dispatch]);
	const contests = useSelector((state: IState) => Object.values(state.contestsById));

	const onFeaturedContestChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setFeaturedContest(event.target.value);
		updateConfig(dispatch, token, {
			featuredContest: event.target.value === "" ? null : event.target.value
		})
	}, [dispatch, token, setFeaturedContest])
	return <Container>
		{contests.map(contest => <Row className="bg-dark rounded text-white pt-2 pb-1 my-2" key={contest._id}>
			<Link to={`/contests/${contest._id}`}>
				<Col>
					<h4>{contestName(contest)}</h4>
				</Col>
				{/* <Col></Col> */}
			</Link>
		</Row>
		)}
		{token && <Row className="text-right">
			<Col>
				<Form inline>
					<Form.Label id="featuredContest">Featured Contest:</Form.Label>
					<Form.Control id="featuredContest" as="select" onChange={onFeaturedContestChanged} value={featuredContest}>
						<option value="">Latest</option>
						{contests.map(contest => <option key={contest._id} value={contest._id}>{contestName(contest)}</option>)}
					</Form.Control>
				</Form>
			</Col>
			<Col>
				<Button variant="dark" onClick={addContestFunc}>
					Add Contest
				</Button>
			</Col>
		</Row>}
	</Container>;
}
