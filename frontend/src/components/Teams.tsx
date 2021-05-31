import * as React from "react";
import { IState, Contest } from "../State";
import { Store, Rest } from 'majsoul-api';
import { useSelector, useDispatch } from "react-redux";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Accordion from "react-bootstrap/Accordion";
import { SongPlayer } from "./utils/SongPlayer";
import { TextField } from "./utils/TextField";
import { createTeam, deleteTeam, patchTeam } from "src/api/Teams";
import { dispatchTeamDeletedAction } from "src/actions/teams/TeamDeletedAction";
import { dispatchTeamPatchedAction } from "src/actions/teams/TeamPatchedAction";
import { dispatchTeamCreatedAction } from "src/actions/teams/TeamCreatedAction";
import { fetchContestPlayers, fetchPlayers } from "src/api/Players";
import { css } from 'astroturf';
import clsx from "clsx";
import { BsChevronCompactDown, BsChevronCompactUp, BsX } from 'react-icons/bs';
import { LoadingSpinner } from "./utils/LoadingSpinner";
import { TeamImage } from "./TeamImage";
import Badge from "react-bootstrap/Badge";
import { Stats } from "./Stats";
import { fetchStats } from "src/api/Contests";

export function jpNumeral(value: number): string {
	let rep = "";
	if (value < 0) {
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

const styles = css`
	.teamDetailsToggle {
		cursor: pointer;
		&:hover {
			color: LightGray;
		}
	}

	.searchResult {
		cursor: pointer;
		&:hover {
			color: LightGray;
			text-decoration: underline;
		}
	}

	.removePlayerIcon {
		cursor: pointer;
		&:hover {
			color: LightGray;
		}
	}

	.teamImage {
		height: 64px;
		width: 64px;
		overflow: hidden;
	}
`;

function PlayerSearch(props: {
	excludedPlayerIds: string[];
	onSelect?: (player: Store.Player<string>) => void;
}): JSX.Element {
	const [searchString, setSearchString] = React.useState<string>();
	const [searchTaskId, setSearchTaskId] = React.useState<any>();
	const [players, setPlayers] = React.useState<Store.Player<string>[]>([]);
	React.useEffect(() => {
		if (searchTaskId) {
			clearTimeout(searchTaskId);
		}

		if (searchString == null || searchString === "") {
			setPlayers([]);
			return;
		}

		setSearchTaskId(setTimeout(() => {
			fetchPlayers({
				name: searchString,
				limit: 10,
			}).then(players => setPlayers(players
				.filter(player => props.excludedPlayerIds.indexOf(player._id) < 0)))
		}, 1000))
	}, [searchString, props.excludedPlayerIds]);

	return <Container>
		<Row>
			<TextField
				id="player-search"
				placeholder="Add Player"
				fallbackValue={searchString}
				className="text-left"
				onChange={(oldValue, newValue) => {
					setSearchString(newValue);
					return {
						value: newValue,
						isValid: true,
					}
				}}
			/>
		</Row>
		{
			players.map(player =>
				<Row
					key={player._id}
					className={clsx("py-1", styles.searchResult)}
					onClick={() => {
						setSearchString("");
						if (props.onSelect) {
							props.onSelect(player);
						}
					}}
				>
					<Col className="text-left">
						{player.nickname}
					</Col>
					<Col className="text-right">
						{player.displayName}
					</Col>
				</Row>
			)
		}
	</Container>
}

function Team(props: {
	contestId: string,
	team: Store.ContestTeam,
	score?: number,
	placing: number,
	maxPlaceLength: number,
}): JSX.Element {
	const token = useSelector((state: IState) => state.user?.token);
	const [name, setName] = React.useState<string>();
	const [image, setImage] = React.useState<string>();
	const [anthem, setAnthem] = React.useState<string>();
	const [playAnthem, setPlayAnthem] = React.useState(false);
	const [viewDetails, setViewDetails] = React.useState(false);
	const [apiPlayers, setApiPlayers] = React.useState<Rest.ContestPlayer<string>[]>(null);
	const [editedPlayers, setEditedPlayers] = React.useState<Partial<Rest.ContestPlayer<string>>[]>(null);
	const [color, setColor] = React.useState<string>();
	const [stats, setStats] = React.useState<Rest.Stats>(null);
	const onColorChange = React.useCallback((oldValue: string, newValue: string) => {
		const isValid = colorRegex.test(newValue);
		const value = isValid ? newValue : oldValue;
		setColor(value);
		return {
			value,
			isValid,
		};
	}, [setColor]);

	const teamAnthem = anthem ?? props.team.anthem ?? "";

	React.useEffect(() => {
		console.log("viewDetails", viewDetails);
		if (!viewDetails) {
			return;
		}
		fetchContestPlayers({
			contestId: props.contestId,
			teamId: props.team._id,
		}).then(players => {
			setApiPlayers(players);
		})

		console.log("fetchStats");
		fetchStats(
			props.contestId,
			{
				team: props.team._id
			}
		).then(stats => {
			setStats(stats[props.team._id]);
		})
	}, [props.team._id, props.contestId, viewDetails]);

	const onAccordionSelect = React.useCallback((selectedKey: string) => {
		setViewDetails(selectedKey === "0");
	}, [setViewDetails])

	const dispatch = useDispatch();

	const players = editedPlayers ?? apiPlayers;

	return <Accordion
		as={Container}
		className="p-0"
		onSelect={onAccordionSelect}
		activeKey={viewDetails ? "0" : null}
	>
		<Accordion.Toggle
			disabled as={Row}
			eventKey="0"
			className={clsx("no-gutters align-items-center flex-nowrap", styles.teamDetailsToggle)}
		>
			{props.placing != null
				&& <Col
					md="auto"
					className="mr-3 text-right"
					style={{ minWidth: `${(props.maxPlaceLength + 1) * 1.25}rem` }}>
					<h3>
						<Badge variant={props.placing === 1 ? "danger" : props.placing > 4 ? "secondary" : "success"}>
							<b>
								{jpNumeral(props.placing)}位
								</b>
						</Badge>
					</h3>
				</Col>
			}
			<Col md="auto" className="mr-3">
				<label>
					<input
						disabled={token == null}
						style={{ display: "none" }}
						type="file"
						onChange={function (event) {
							const reader = new FileReader();
							const input = event.target as HTMLInputElement;
							if (input.files && input.files[0]) {
								reader.onload = function (e) {
									setImage(e.target.result.toString());
								}
								reader.readAsDataURL(input.files[0]);
							}
						}}
					/>
					<TeamImage className={clsx(styles.teamImage, "rounded")} team={props.team} />
				</label>
			</Col>
			<Col md="auto" className="text-nowrap" style={{ flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold text-capitalize h5 text-truncate" style={{ borderBottom: `3px solid #${props.team.color}` }}>
							{props.team.name ?? `#${props.team._id}`}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col></Col>
			{isNaN(props.score) || <Col md="auto" className="ml-3"> <h5><b>{props.score / 1000}</b></h5></Col>}
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<>
				<Stats stats={stats} />
				{players == null
					? <LoadingSpinner />
					: <Container className="p-0">
						{[...players].sort((a, b) => (b.tourneyScore ?? 0) - (a.tourneyScore ?? 0)).map(player =>
							<Row key={player._id} className="no-gutters py-1">
								<Col md="auto" style={{ minWidth: `${(props.maxPlaceLength + 1) * 1.25}rem` }} className="mr-3" />
								<Col md="auto" style={{ minWidth: 64 }} className="mr-3">
									{token && <BsX
										className={styles.removePlayerIcon}
										onClick={() => setEditedPlayers(players.filter(p => p._id !== player._id))}
									/>}
								</Col>
								<Col className="text-left">
									{player.displayName ?? player.nickname}
								</Col>
								<Col className="text-right">
									{(player.tourneyScore ?? 0) / 1000}
								</Col>
							</Row>
						)}
					</Container>
				}
				{token &&
					<Container>
						{(teamAnthem?.length > 0) && <SongPlayer videoId={teamAnthem} play={playAnthem} />}
						<Row>
							<Col>
								<TextField
									inline
									label="Name"
									id={`${props.team._id}-name-editor`}
									placeholder={`#${props.team._id}`}
									fallbackValue={props.team.name}
									onChange={(_, newValue) => {
										setName(newValue);
										return {
											value: newValue,
											isValid: true,
										}
									}}
								/>
							</Col>
							<Col md="auto">
								<Button
									onClick={() =>
										deleteTeam(token, props.contestId, props.team._id)
											.then(() => dispatchTeamDeletedAction(dispatch, props.contestId, props.team._id))
									}
								>
									Delete
								</Button>
							</Col>
							<Col md="auto">
								<Button
									variant="secondary"
									disabled={
										(name === props.team.name || name === undefined)
										&& (image === props.team.image || image === undefined)
										&& (color === props.team.anthem || color === undefined)
										&& (anthem === props.team.anthem || anthem === undefined)
										&& (editedPlayers == null)
									}
									onClick={(event: any) => {
										patchTeam(
											token,
											props.contestId,
											{
												_id: props.team._id,
												name: name,
												anthem: anthem,
												image: image,
												players: players,
												color
											} as Store.ContestTeam
										).then(team => dispatchTeamPatchedAction(dispatch, props.contestId, team))
									}}
								>Save</Button>
							</Col>
						</Row>
						<Row>
							<Col>
								<TextField
									inline
									label="Anthem"
									id={`${props.team._id}-anthem-editor`}
									fallbackValue={props.team.anthem}
									onChange={(_, newValue) => {
										setPlayAnthem(false);
										setAnthem(newValue);
										return {
											value: newValue,
											isValid: true,
										}
									}}
								/>
							</Col>
							<Col md="auto">
								<Button onClick={() => teamAnthem?.length > 0 && setPlayAnthem(!playAnthem)}>
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
						</Row>
						<Row>
							<PlayerSearch
								excludedPlayerIds={(players ?? []).map(player => player._id)}
								onSelect={(player) => setEditedPlayers([...(players ?? []), player])}
							/>
						</Row>
					</Container>
				}
			</>
		</Accordion.Collapse>
	</Accordion>;
}

function TeamRow(props: {
	first?: boolean,
	children: React.ReactNode,
}): JSX.Element {
	return <Row className={`${props.first ? "" : "mt-3"} no-gutters text-center`} style={{ maxWidth: 640, margin: "auto" }}>
		<Col>
			{props.children}
		</Col>
	</Row>
}

function TeamList(props: {
	teams: TeamData[];
	maxPlaceLength: number;
	contestId: string;
}): JSX.Element {
	return <>
		{ props.teams.map((team) =>
			<TeamRow key={team._id} first={team.placing === 0}>
				<Team
					contestId={props.contestId}
					team={team}
					score={team.total}
					placing={team.placing + 1}
					maxPlaceLength={props.maxPlaceLength}
				/>
			</TeamRow>
		)}
	</>
}

interface TeamData extends Store.ContestTeam<string> {
	placing: number;
	total: number;
}

export function Teams(props: {
	contest?: Contest;
	session?: Rest.Session;
	teamLimit?: number;
}): JSX.Element {
	const { teamLimit = 8 } = props;
	const token = useSelector((state: IState) => state.user?.token);

	const dispatch = useDispatch();

	const addTeamOnClick = React.useCallback(() => {
		const id = props.contest._id;
		if (id == null) {
			return;
		}

		createTeam(token, id).then(team => dispatchTeamCreatedAction(dispatch, id, team));
	}, []);

	const [viewDetails, setViewDetails] = React.useState(false);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setViewDetails(accordionKey === "0");
	}, [setViewDetails]);

	const teams = props.contest?.teams;
	if (!teams || !props.session) {
		return <Container className="rounded bg-dark text-light px-3 py-4">
			<Row>
				<Col className="text-center">
					<LoadingSpinner />
				</Col>
			</Row>
		</Container>
	}

	const teamsArray: TeamData[] =
		Object.values(teams)
			.map(team => ({ ...team, total: props.session.aggregateTotals[team._id] }))
			.sort((a, b) => b.total - a.total)
			.map((team, placing) => ({ ...team, placing }));

	const maxPlaceLength = jpNumeral(teamsArray.length).length;

	return <Container className="rounded bg-dark text-light px-3 py-4">
		<TeamList
			contestId={props.contest._id}
			maxPlaceLength={maxPlaceLength}
			teams={teamsArray.slice(0, teamLimit)}
		/>
		{teamsArray.length > teamLimit && <Accordion
			as={Container}
			className="p-0"
			onSelect={onAccordionSelect}
			activeKey={viewDetails ? "0" : null}
		>
			<Accordion.Collapse eventKey="0">
				<TeamList
					contestId={props.contest._id}
					maxPlaceLength={maxPlaceLength}
					teams={teamsArray.slice(teamLimit)}
				/>
			</Accordion.Collapse>
			<Accordion.Toggle
				disabled as={Row}
				eventKey="0"
			>
				<Col className="text-center pb-1">
					{
						viewDetails
							? <BsChevronCompactUp color="white" size="30px" />
							: <BsChevronCompactDown color="white" size="30px" />
					}
				</Col>
			</Accordion.Toggle>
		</Accordion>}
		{token && <TeamRow>
			<Button onClick={addTeamOnClick}>Add Team</Button>
		</TeamRow>}
	</Container>;
}
