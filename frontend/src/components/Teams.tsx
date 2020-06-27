import * as React from "react";
import { IState, Session, ContestTeam } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import defaultImage from "../../assets/hatsu.png";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import { patchTeam } from "../Actions";

function jpNumeral(value: number): string {
	let rep = "";
	if (value < 0){
		value *= -1;
		rep += "-";
	}

	for (const counters = ["", "十", "百", "千", "万"]; value > 0 && counters.length > 0; counters.shift(), value = (value / 10) | 0) {
		let digit = value % 10;
		if (digit === 0) {
			continue;
		}

		if (digit === 1 && counters[0].length > 0) {
			digit = 0;
		}

		const stringDigit = digit > 0 ? (digit).toLocaleString("zh-u-nu-hanidec") : "";

		rep = `${stringDigit}${counters[0]}${rep}`
	}
	return rep;
}

export function Team(props: {team: ContestTeam, score?: number, placing?: number}): JSX.Element {
	const user = useSelector((state: IState) => state.user);
	const [image, setImage] = React.useState(props.team.image ?? defaultImage);
	const dispatch = useDispatch();
	return <Container className="p-0">
		<Row className="no-gutters align-items-center flex-nowrap">
			{props.placing != null && <Col md="auto" className="mr-3"> <h5><b>{jpNumeral(props.placing)}位</b></h5></Col>}
			<Col md="auto" className="mr-3">
				<label
					className="rounded"
					style={{
						display: "block",
						margin: 0,
						height: 64,
						width: 64,
						backgroundImage: `url(${image})`,
						backgroundRepeat: "no-repeat",
						backgroundPosition: "center",
						backgroundSize: "contain"
					}}
				>
					<input disabled={user?.token == null} style={{display: "none"}} type="file" onChange={function (event){
						const reader = new FileReader();
						const input = event.target as HTMLInputElement;
						if (input.files && input.files[0]) {
							reader.onload = function(e) {
								setImage(e.target.result);
							}
							reader.readAsDataURL(input.files[0]);
						}
					}}/>
				</label>
			</Col>
			<Col md="auto" className="text-nowrap" style={{flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis"}}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold text-capitalize h5 text-truncate" style={{borderBottom: `3px solid ${props.team.color}`}}>
							{props.team.name.toLocaleLowerCase()}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col></Col>
			{ isNaN(props.score) || <Col md="auto" className="ml-3"> <h5><b>{props.score / 1000}</b></h5></Col> }
			{ (props.team.image !== image && image !== defaultImage) &&
				<Col md="auto">
					<Button
						variant="secondary"
						onClick={(event: any) => {patchTeam(dispatch, user.token, {image: image, _id: props.team._id} as ContestTeam)}}
					>Save</Button>
				</Col>
			}
		</Row>
	</Container>
}

export function Teams(props: { session?: Session; }): JSX.Element {
	const teams = useSelector((state: IState) => state?.contest?.teams);
	if (!teams) {
		return null;
	}

	let teamsArray = Object.values(teams);
	if (props.session != null) {
		teamsArray = teamsArray.map(team => ({...team, total: props.session.aggregateTotals[team._id]})).sort((a, b) => b.total - a.total);
	}

	return <Container className="rounded bg-dark text-light px-3 py-4">
		{teamsArray.map((team, placing) => <Row key={team._id} className={`${placing > 0 ? "mt-3" : ""} no-gutters`} style={{maxWidth: 640, margin: "auto"}}>
			<Team
				team={team}
				score={props.session?.aggregateTotals[team._id]}
				placing={placing + 1} />
		</Row>)}
	</Container>;
}