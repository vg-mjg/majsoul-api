import * as React from "react";
import { IState, Contest } from "../State";
import { Store, Rest } from 'majsoul-api';
import { useSelector, useDispatch } from "react-redux";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import defaultImage from "../../assets/hatsu.png";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import { patchTeam } from "../Actions";
import { SongPlayer } from "./utils/SongPlayer";
import { TextField } from "./utils/TextField";

export function jpNumeral(value: number): string {
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

const colorRegex = /^([0-9A-Fa-f]{0,6})$/;

export function Team(props: {contestId: string, team: Store.ContestTeam, score?: number, placing?: number}): JSX.Element {
	const token = useSelector((state: IState) => state.user?.token);
	const [image, setImage] = React.useState(props.team.image ?? defaultImage);
	const [anthem, setAnthem] = React.useState(props.team?.anthem);
	const [playAnthem, setPlayAnthem] = React.useState(false);
	const [color, setColor] = React.useState<string>();
	const onColorChange = React.useCallback((oldValue: string, newValue: string) => {
		const isValid = colorRegex.test(newValue);
		const value = isValid ? newValue : oldValue;
		setColor(value);
		return {
			value,
			isValid,
		};
	}, [setColor]);

	const dispatch = useDispatch();
	return <Accordion as={Container} className="p-0">
		{(anthem?.length > 0) && <SongPlayer videoId={anthem} play={playAnthem}/> }
		<Accordion.Toggle disabled as={Row} eventKey={(token == null ? -1 : 0).toString()} className="no-gutters align-items-center flex-nowrap">
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
					<input disabled={token == null} style={{display: "none"}} type="file" onChange={function (event){
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
						<Col md="auto" className="font-weight-bold text-capitalize h5 text-truncate" style={{borderBottom: `3px solid #${props.team.color}`}}>
							{props.team.name.toLocaleLowerCase()}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col></Col>
			{ isNaN(props.score) || <Col md="auto" className="ml-3"> <h5><b>{props.score / 1000}</b></h5></Col> }
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<Container>
				<Row>
					<Col>
						<Form.Control
							// plaintext={!token || !editTime}
							// readOnly={!token || !editTime}
							// isInvalid={timeIsInvalid}
							// className={`py-0${(!token || !editTime) ? " text-light" : ""}`}
							value={anthem}
							onChange={event => {
								setPlayAnthem(false);
								setAnthem(event.target.value);
							}}
							/>
					</Col>
					<Col md="auto">
						<Button onClick={() => anthem?.length > 0 && setPlayAnthem(!playAnthem)}>
							{playAnthem ? "Stop" : "Play"}
						</Button>
					</Col>
				</Row>
				<Row>
					<Col>
						<TextField
							id={`team-${props.team._id}-color-editor`}
							label="Color"
							fallbackValue={color ?? props.team.color}
							onChange={onColorChange}
							inline
						/>
					</Col>
					<Col md="auto">
						<Button
							variant="secondary"
							disabled={
								(props.team.image === image || image === defaultImage)
								&& (anthem === props.team.anthem || anthem === undefined)
								&& (color === props.team.anthem || color === undefined)
							}
							onClick={(event: any) => {patchTeam(
								dispatch,
								token,
								props.contestId,
								{
									image: image,
									_id: props.team._id,
									anthem: anthem,
									color
								} as Store.ContestTeam)
							}}
						>Save</Button>
					</Col>
				</Row>
			</Container>
		</Accordion.Collapse>
	</Accordion>;

}

export function Teams(props: {
	contest?: Contest;
	session?: Rest.Session;
}): JSX.Element {
	const teams = props.contest?.teams;
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
				contestId={props.contest?._id}
				team={team}
				score={props.session?.aggregateTotals[team._id]}
				placing={placing + 1} />
		</Row>)}
	</Container>;
}
