import * as React from "react";
import { useCallback } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";
import { useDispatch,useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { dispatchContestCreatedAction } from "../actions/contests/ContestCreatedAction";
import { dispatchContestsIndexRetrievedAction } from "../actions/contests/ContestsIndexRetrievedAction";
import { fetchConfig, updateConfig } from "../api/Config";
import { createContest, fetchContests } from "../api/Contests";
import { fetchGoogleAuthUrl } from "../api/Rigging";
import { IState } from "../State";
import { contestName } from "./utils";

export function ContestList(): JSX.Element {
	const dispatch = useDispatch();
	const token = useSelector((state: IState) => state.user?.token);
	const [featuredContest, setFeaturedContest] = React.useState<string>(undefined);
	const addContestFunc = useCallback(() =>
		createContest(token).then(contest => dispatchContestCreatedAction(dispatch, contest))
	, [dispatch, token]);

	const redirectForAuth = useCallback(
		() => fetchGoogleAuthUrl(token).then(response => {
			window.location.href = response.authUrl;
		}),
		[dispatch, token]
	);

	React.useEffect(() => {
		fetchContests().then(index => dispatchContestsIndexRetrievedAction(dispatch, index));
		fetchConfig().then((config) => setFeaturedContest(config.featuredContest ?? ""));
	}, [dispatch]);
	const contests = useSelector((state: IState) => Object.values(state.contestsById));

	const { t, i18n } = useTranslation();

	React.useEffect(() => {
		document.title = t("title.contest.list");
	}, [i18n.language]);

	const onFeaturedContestChanged = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setFeaturedContest(event.target.value);
		updateConfig(token, {
			featuredContest: event.target.value === "" ? null : event.target.value
		});
	}, [dispatch, token, setFeaturedContest]);
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
			<Col sm="auto">
				<Button variant="dark" onClick={redirectForAuth}>
					Add Token
				</Button>
			</Col>
			<Col sm="auto">
				<Button variant="dark" onClick={addContestFunc}>
					Add Contest
				</Button>
			</Col>
		</Row>}
	</Container>;
}
