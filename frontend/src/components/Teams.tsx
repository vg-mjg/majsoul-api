import { stylesheet } from "astroturf";
import type { Rest, Store } from "backend";
import { LeagueContestGroup } from "backend/dist/store";
import { TourneyContestPhaseSubtype } from "backend/dist/store/enums.js";
import clsx from "clsx";
import * as React from "react";
import Accordion from "react-bootstrap/Accordion";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { BsChevronCompactDown, BsChevronCompactUp, BsX } from "react-icons/bs";
import { useDispatch, useSelector } from "react-redux";

import { dispatchTeamCreatedAction } from "../actions/teams/TeamCreatedAction";
import { dispatchTeamDeletedAction } from "../actions/teams/TeamDeletedAction";
import { dispatchTeamPatchedAction } from "../actions/teams/TeamPatchedAction";
import { refresh, StatsRequest } from "../api/Contests";
import { fetchContestPlayers, fetchPlayers } from "../api/Players";
import { createTeam, deleteTeam, patchTeam } from "../api/Teams";
import { IState } from "../State";
import { ContestContext } from "./contest/ContestProvider";
import { Stats } from "./Stats/Stats";
import globalStyles from "./styles.sass";
import { TeamImage } from "./TeamImage";
import { LoadingSpinner } from "./utils/LoadingSpinner";
import { SongPlayer } from "./utils/SongPlayer";
import { TextField } from "./utils/TextField";
import { useTranslation } from "react-i18next";
import { useHistory, useLocation } from "react-router-dom";

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

		rep = `${stringDigit}${counters[0]}${rep}`;
	}
	return rep;
}

const colorRegex = /^([0-9A-Fa-f]{0,6})$/;

const styles = stylesheet`
	.groupImage {
		height: 32px;
		width: 32px;
		overflow: hidden;
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

	const { contestId } = React.useContext(ContestContext);
	const contest = useSelector((state: IState) => state.contestsById[contestId]);

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
				.filter(player => props.excludedPlayerIds.indexOf(player._id) < 0)));
		}, 1000));
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
					};
				}}
			/>
		</Row>
		{
			players.map(player =>
				<Row
					key={player._id}
					className={clsx("py-1", globalStyles.linkDark, globalStyles.linkUnderline)}
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
						{contest.nicknameOverrides?.find(override => override._id === player._id)?.nickname ?? player.displayName}
					</Col>
				</Row>
			)
		}
	</Container>;
}

function Team(props: {
	team: Store.ContestTeam,
	score?: number,
	placing: number,
	maxPlaceLength: number,
	groupImage: string,
}): JSX.Element {
	const { contestId } = React.useContext(ContestContext);
	const contest = useSelector((state: IState) => state.contestsById[contestId]);
	const showTeamLogo = contest?.subtype !== TourneyContestPhaseSubtype.TeamQualifier;

	const token = useSelector((state: IState) => state.user?.token);
	const [name, setName] = React.useState<string>();
	const [image, setImage] = React.useState<string>();
	const [anthem, setAnthem] = React.useState<string>();
	const [playAnthem, setPlayAnthem] = React.useState(false);
	const [viewDetails, setViewDetails] = React.useState(false);
	const [apiPlayers, setApiPlayers] = React.useState<Rest.ContestPlayer<string>[]>(null);
	const [editedPlayers, setEditedPlayers] = React.useState<Partial<Rest.ContestPlayer<string>>[]>(null);
	const [color, setColor] = React.useState<string>();
	const [statsRequest, setStatsRequest] = React.useState<StatsRequest>(null);
	const [selectedPlayerName, setSelectedPlayerName] = React.useState<string>();
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
		if (!viewDetails) {
			return;
		}
		fetchContestPlayers({
			contestId: contestId,
			teamId: props.team._id,
		}).then(players => {
			setApiPlayers(players);
		});

		setStatsRequest({
			team: props.team._id
		});
	}, [props.team._id, contestId, viewDetails]);

	const onAccordionSelect = React.useCallback((selectedKey: string) => {
		setViewDetails(selectedKey === "0");
	}, [setViewDetails]);

	const dispatch = useDispatch();

	const players = editedPlayers ?? props.team.hidePlayers ? [] : apiPlayers;

	return <Accordion
		as={Container}
		className="p-0"
		onSelect={onAccordionSelect}
		activeKey={viewDetails ? "0" : null}
	>
		<Accordion.Toggle
			disabled as={Row}
			eventKey="0"
			className={clsx("no-gutters align-items-center flex-nowrap", globalStyles.linkDark)}
		>
			{props.groupImage
				&& <Col
					md="auto"
					className="mr-3"
				>
					<img className={clsx(styles.groupImage, "rounded")} src={props.groupImage} />
				</Col>
			}
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
			{showTeamLogo &&
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
									};
									reader.readAsDataURL(input.files[0]);
								}
							}}
						/>
						<TeamImage
							className={clsx(styles.teamImage, "rounded")}
							teamImage={(viewDetails && props?.team?.altImage)
								? props?.team?.altImage
								: props.team?.image
							}
						/>
					</label>
				</Col>
			}
			<Col md="auto" className="text-nowrap" style={{ flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
				<Container className="p-0">
					<Row className="no-gutters">
						<Col md="auto" className="font-weight-bold text-capitalize h5 text-truncate" style={{ borderBottom: `3px solid #${props.team.color}` }}>
							{(viewDetails && props?.team?.altName)
								? props?.team?.altName
								: (props.team.name ?? `#${props.team._id}`)
							}
						</Col>
					</Row>
				</Container>
			</Col>
			<Col></Col>
			{isNaN(props.score) || <Col md="auto" className="ml-3"> <h5><b>{props.score / 1000}</b></h5></Col>}
		</Accordion.Toggle>
		<Accordion.Collapse as={Row} eventKey="0">
			<>
				<Container className={clsx("p-0")}>
					<Row>
						{players && <Col className="text-center">
							<span
								className={clsx("h5 font-weight-bold", globalStyles.linkDark)}
								onClick={() => {
									setSelectedPlayerName(null);
									setStatsRequest({ team: props.team._id });
								}}
							>{props.team.name}</span>&nbsp;
							<span className="h5">{selectedPlayerName}</span>
						</Col>}
					</Row>
					<Row>
						<Stats
							request={statsRequest}
							hideResults={players == null}
						/>
					</Row>
				</Container>
				{players == null
					? <LoadingSpinner />
					: <Container className="p-0">
						{[...players].sort((a, b) => (b.tourneyScore ?? 0) - (a.tourneyScore ?? 0)).map(player => {
							const nickname = contest.nicknameOverrides?.find(override => override._id === player._id)?.nickname ?? player.displayName ?? player.nickname;
							return <Row key={player._id} className="no-gutters py-1">
								<Col md="auto" style={{ minWidth: `${(props.maxPlaceLength + 1) * 1.25}rem` }} className="mr-3" />
								<Col md="auto" style={{ minWidth: 64 }} className="mr-3">
									{token && <BsX
										className={globalStyles.linkDark}
										onClick={() => setEditedPlayers(players.filter(p => p._id !== player._id))}
									/>}
								</Col>
								<Col
									className={clsx("text-left", globalStyles.linkDark)}
									onClick={() => {
										setStatsRequest({ player: player._id });
										setSelectedPlayerName(nickname);
									}}
								>
									{nickname}
								</Col>
								<Col className="text-right">
									{(player.tourneyScore ?? 0) / 1000}
								</Col>
							</Row>;
						})}
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
										};
									}}
								/>
							</Col>
							<Col md="auto">
								<Button
									onClick={() =>
										deleteTeam(token, contestId, props.team._id)
											.then(() => dispatchTeamDeletedAction(dispatch, contestId, props.team._id))
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
									onClick={() => {
										patchTeam(
											token,
											contestId,
											{
												_id: props.team._id,
												name: name,
												anthem: anthem,
												image: image,
												players: players,
												color
											} as Store.ContestTeam
										).then(team => dispatchTeamPatchedAction(dispatch, contestId, team));
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
										};
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
	</Row>;
}

function TeamList(props: {
	teams: TeamData[];
	groups: LeagueContestGroup[];
	maxPlaceLength: number;
}): JSX.Element {
	return <>
		{props.teams.map((team) =>
			<TeamRow key={team._id} first={team.placing === 0}>
				<Team
					team={team}
					score={team.total}
					placing={team.placing + 1}
					maxPlaceLength={props.maxPlaceLength}
					groupImage={props.groups?.find(group => !!group.teams.find(t => t.id === team._id))?.image}
				/>
			</TeamRow>
		)}
	</>;
}

interface TeamData extends Store.ContestTeam<string> {
	placing: number;
	total: number;
}

const groupStyles = stylesheet`
	.group {
		display: flex;
		align-items: center;
		font-weight: bold;
		font-size: 20px;

		&:not(:first-child) {
			margin-left: 16px;
		}

		cursor: pointer;

		&:hover {
			text-decoration: underline;
			color: #cdcdcd;
		}

		&.reverse {
			flex-direction: row-reverse;
		}

		> * {
			margin: 16px;
		}

		&:not(.selected):hover {
			.groupImage {
				height: 40px;
				width: 40px;
			}
		}
	}

	.selected {
		flex: 1;
		.groupImage {
			height: 48px;
			width: 48px;
		}
	}

	.groupImage {
		height: 32px;
		width: 32px;
		overflow: hidden;
	}

	.groupContainer {
		display: flex;
		justify-content: center;
		background-color: #24292d;
		min-height: 80px;
		margin-left: -16px;
		margin-right: -16px;
		margin-top: -22px;
		margin-bottom: 8px;
		&.bottom {
			margin-top: 8px;
			margin-bottom: -22px;
		}
	}

	.groupSelector {
		flex: 1;
		max-width: 640px;
		display: flex;
	}
`;

const GroupTab: React.FC<{
	image: string;
	name: string;
	reverse?: boolean;
	selected?: boolean;
	onClick: () => void;
}> = ({ image, name, reverse, selected, onClick }) => {
	return <div
		className={clsx(
			groupStyles.group,
			reverse && groupStyles.reverse,
			selected && groupStyles.selected
		)}
		onClick={onClick}
	>
		<img src={image} className={clsx(groupStyles.groupImage, "rounded")} />
		<div>{name}</div>
	</div>;
};

const GroupSelector: React.FC<{
	groups: Store.LeagueContestGroup[]
	selectedGroup: LeagueContestGroup
	bottom?: boolean
}> = ({ groups, selectedGroup, bottom }) => {
	if (!groups) {
		return null;
	}

	const history = useHistory();
	const { t } = useTranslation();

	return <div className={clsx(groupStyles.groupContainer, bottom && groupStyles.bottom)}>
		<div className={groupStyles.groupSelector}>
			<GroupTab
				{...groups[0]}
				onClick={() => history.push({
					search: `group=${groups[0].name}`,
					hash: history.location.hash
				})}
				selected={selectedGroup?.name === groups[0].name}
			/>
			<div
				className={clsx(groupStyles.group, !selectedGroup && groupStyles.selected)}
				style={{ justifyContent: "center" }}
				onClick={() => history.push({
					search: "",
					hash: history.location.hash
				})}
			>
				{t("league.allTeams")}
			</div>
			<GroupTab
				{...groups[1]}
				reverse
				onClick={() => history.push({
					search: `group=${groups[1].name}`,
					hash: history.location.hash
				})}
				selected={selectedGroup?.name === groups[1].name}
			/>
		</div>
	</div>;
};

export function Teams(props: {
	isLoading?: boolean;
	teamScores: Record<string, number>;
	teamLimit?: number;
}): JSX.Element {
	const { teamLimit = 8 } = props;
	const token = useSelector((state: IState) => state.user?.token);

	const dispatch = useDispatch();

	const { contestId } = React.useContext(ContestContext);
	const teams = useSelector((state: IState) => state.contestsById[contestId]?.teams ?? {});
	const groups = useSelector((state: IState) => state.contestsById[contestId]?.groups);

	const { search } = useLocation();
	const params = React.useMemo(() => new URLSearchParams(search), [search]);
	const selectedGroup = groups?.find(group => group.name === params.get("group"));

	const addTeamOnClick = React.useCallback(() => {
		const id = contestId;
		if (id == null) {
			return;
		}

		createTeam(token, id).then(team => dispatchTeamCreatedAction(dispatch, id, team));
	}, []);

	const refreshContest = React.useCallback(() => {
		const id = contestId;
		if (id == null) {
			return;
		}

		refresh(token, id);
	}, []);

	const [viewDetails, setViewDetails] = React.useState(false);

	const onAccordionSelect = React.useCallback((accordionKey: string) => {
		setViewDetails(accordionKey === "0");
	}, [setViewDetails]);

	const {
		teamScores = {},
	} = props;

	const teamsArray: TeamData[] =
		Object.values(teams)
			.filter(team =>
				team._id in teamScores
				&& (
					!groups
					|| !selectedGroup
					|| selectedGroup.teams.find(t => t.id === team._id)
				))
			.map(team => ({ ...team, total: teamScores[team._id] }))
			.sort((a, b) => b.total - a.total)
			.map((team, placing) => ({ ...team, placing }));

	const maxPlaceLength = jpNumeral(teamsArray.length).length;

	if (props.isLoading) {
		return <Container className="rounded bg-dark text-light px-3 py-4">
			<Row>
				<Col className="text-center">
					<LoadingSpinner />
				</Col>
			</Row>
		</Container>;
	}

	return <Container className="rounded bg-dark text-light px-3 py-4">
		<GroupSelector groups={groups} selectedGroup={selectedGroup} />
		<TeamList
			maxPlaceLength={maxPlaceLength}
			teams={teamsArray.slice(0, teamLimit)}
			groups={groups}
		/>
		{teamsArray.length > teamLimit && <Accordion
			as={Container}
			className="p-0"
			onSelect={onAccordionSelect}
			activeKey={viewDetails ? "0" : null}
		>
			<Accordion.Collapse eventKey="0">
				<TeamList
					maxPlaceLength={maxPlaceLength}
					teams={teamsArray.slice(teamLimit)}
					groups={groups}
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
		<GroupSelector groups={groups} bottom selectedGroup={selectedGroup} />
		{token && <TeamRow>
			<Button onClick={addTeamOnClick}>Add Team</Button>
			<Button onClick={refreshContest}>Refresh</Button>
		</TeamRow>}
	</Container>;
}
