import * as React from "react";
import { IState } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { ContestType, TourneyContestType } from "majsoul-api/dist/store/types/types";
import Form from "react-bootstrap/Form";
import { useState } from "react";
import Button from "react-bootstrap/Button";
import { TextField } from "./utils/TextField";
import { GameResult } from "majsoul-api/dist/rest";
import { createGame, fetchGame, deleteGame, fetchPendingGames } from "src/api/Games";
import { patchContest } from "src/api/Contests";
import { dispatchContestPatchedAction } from "src/actions/contests/ContestPatchedAction";

const CustomGameAdder: React.FC<{
	contestId: string;
	onGameCreated: (game: GameResult<string>) => void;
}> = ({
	contestId,
	onGameCreated,
}) => {
		const dispatch = useDispatch();
		const token = useSelector((state: IState) => state.user?.token);
		const [majsoulId, setMajsoulId] = useState("");
		return <Row className="no-gutters">
			<Col>
				<TextField
					id="customGameIdEditor"
					fallbackValue=""
					placeholder="Custom Game Id"
					onCommit={(value) => {
						setMajsoulId(value);
						return value;
					}} />
			</Col>
			<Col className="text-right">
				<Button
					variant="secondary"
					disabled={(majsoulId?.length ?? 0) <= 0}
					onClick={(event: any) => {
						createGame(token, {
							contestId,
							majsoulId,
						}).then(_id => onGameCreated({
							majsoulId,
							contestId,
							_id,
						}));
					}}
				>Add</Button>
			</Col>
		</Row>
	}

const PendingGameDisplay: React.FC<{
	game: GameResult<string>;
	onGameDeleted: (id: string) => void;
}> = ({
	game,
	onGameDeleted,
}) => {
		const dispatch = useDispatch();
		const [notFoundOnMajsoulUpdated, setNotFoundOnMajsoulUpdated] = useState<boolean>(undefined);
		const token = useSelector((state: IState) => state.user?.token);

		const notFoundOnMajsoul = game.notFoundOnMajsoul ?? notFoundOnMajsoulUpdated;

		React.useEffect(() => {
			if (game.notFoundOnMajsoul != null) {
				return;
			}
			setTimeout(() => fetchGame(game._id).then(game => setNotFoundOnMajsoulUpdated(game.notFoundOnMajsoul)), 5000);
		}, [game.notFoundOnMajsoul]);

		return <Row className="no-gutters">
			<Col>
				{game.majsoulId}
			</Col>
			<Col>
				{(notFoundOnMajsoul) === true ? "Not Found" : (notFoundOnMajsoul) === false ? "Found" : "Pending"}
			</Col>
			<Col className="text-right">
				<Button
					variant="secondary"
					disabled={notFoundOnMajsoul !== true}
					onClick={(event: any) => {
						deleteGame(token, game._id).then(() => onGameDeleted(game._id));
					}}
				>Delete</Button>
			</Col>
		</Row>
	}

const ContestCustomGames: React.FC<{
	contestId: string;
}> = ({
	contestId,
}) => {
		const dispatch = useDispatch();
		const [pendingGames, setPendingGames] = useState<GameResult<string>[]>([]);
		const onGameDeleted = React.useCallback((gameId: string) => {
			if (!pendingGames.find(game => game._id === gameId)) {
				return;
			}
			setPendingGames(pendingGames.filter(game => game._id !== gameId));
		}, [pendingGames]);

		const onGameCreated = React.useCallback((game: GameResult<string>) => {
			setPendingGames(pendingGames.concat(game));
		}, [pendingGames]);

		React.useEffect(() => {
			fetchPendingGames(contestId).then(games => setPendingGames(games));
		}, [contestId])
		return <>
			<Row className="no-gutters">
				<Col>
					<h4>Custom Games</h4>
				</Col>
			</Row>
			{pendingGames.map(game => <PendingGameDisplay
				key={game._id}
				game={game}
				onGameDeleted={onGameDeleted}
			/>)}
			<CustomGameAdder contestId={contestId} onGameCreated={onGameCreated} />
		</>
	}

const contestTypeValues =
	Object.keys(ContestType)
		.map(k => parseInt(k))
		.filter(k => !isNaN(k));

const tourneyContestTypeValues =
	Object.keys(TourneyContestType)
		.map(k => parseInt(k))
		.filter(k => !isNaN(k));

export function ContestMetadataEditor(props: { contestId: string; }): JSX.Element {
	const token = useSelector((state: IState) => state.user?.token);
	const contest = useSelector((state: IState) => state.contestsById[props.contestId]);
	const [majsoulFriendlyId, setMajsoulFriendlyId] = useState<number>(undefined);
	const [type, setType] = useState<ContestType>(undefined);
	const [tourneyType, setTourneyType] = useState<TourneyContestType>(undefined);
	const [displayName, setDisplayName] = useState<string>(undefined);
	const [maxGames, setMaxGames] = useState<number>(undefined);
	const [anthem, setAnthem] = useState<string>(undefined);
	const [spreadsheetId, setSpreadsheetId] = useState<string>(undefined);
	const [initialPhaseName, setInitialPhaseName] = useState<string>(undefined);
	const [tagline, setTagline] = useState<string>(undefined);
	const [taglineAlternate, setTaglineAlternate] = useState<string>(undefined);
	const [bonusPerGame, setBonusPerGame] = useState<number>(undefined);
	const [track, setTrack] = useState<boolean>(undefined);
	const dispatch = useDispatch();
	if (token == null || contest == null) {
		return null;
	}

	return <Container className="pt-3 pb-3 px-4 bg-dark rounded text-white">
		<Row className="no-gutters">
			<Col>
				<TextField
					inline
					label="Majsoul ID:"
					id="majsoulEditor"
					placeholder="Not Linked"
					fallbackValue={contest.majsoulFriendlyId?.toString() ?? ""}
					onChange={(oldValue: string, newValue: string) => {
						if (newValue === "") {
							return {
								value: null,
								isValid: true,
							};
						}
						const id = parseInt(newValue);
						return {
							value: newValue,
							isValid: id >= 100000 && id < 1000000 && !isNaN(id)
						};
					}}
					onCommit={(value: string, isValid: boolean) => {
						if (value == null) {
							if (value === null) {
								setMajsoulFriendlyId(null);
							}
							return value;
						}

						if (isValid) {
							const intValue = parseInt(value);
							setMajsoulFriendlyId(intValue);
							return intValue.toString();
						}

						if (majsoulFriendlyId == null) {
							return majsoulFriendlyId as null | undefined;
						}

						return majsoulFriendlyId.toString();
					}}
				/>
			</Col>
			<Col>
				<TextField
					inline
					label="Max Games"
					id="contestMaxGamesEditor"
					fallbackValue={contest.maxGames?.toString() ?? ""}
					onChange={(oldValue, newValue) => {
						if (newValue === "") {
							return {
								value: null,
								isValid: true,
							};
						}
						const value = parseInt(newValue);
						return {
							isValid: value >= 0,
							value: newValue,
						}
					}}
					onCommit={(value: string, isValid: boolean) => {
						if (value == null) {
							if (value === null) {
								setMaxGames(null);
							}
							return value;
						}

						if (isValid) {
							const intValue = parseInt(value);
							setMaxGames(intValue);
							return intValue.toString();
						}

						if (maxGames == null) {
							return maxGames as null | undefined;
						}

						return maxGames.toString();
					}}
				/>
			</Col>
			<Col>
				<Form inline className="justify-content-end">
					<Form.Label
						className="font-weight-bold mr-2"
						htmlFor="contestTypeSelector"
					>
						Type:
					</Form.Label>
					<Form.Control
						id="contestTypeSelector"
						as="select"
						custom
						value={type ?? contest.type ?? contestTypeValues[0]}
						size="sm"
						onChange={(event) => setType(parseInt(event.target.value) as ContestType)}
					>
						{contestTypeValues.map((value, index) => <option key={index} value={value}>{ContestType[value]}</option>)}
					</Form.Control>
				</Form>
				{((type ?? contest.type ?? contestTypeValues[0]) === ContestType.Tourney) &&
					<Form.Control
						id="tourneyContestTypeSelector"
						as="select"
						custom
						value={tourneyType ?? contest.tourneyType ?? tourneyContestTypeValues[0]}
						size="sm"
						onChange={(event) => setTourneyType(parseInt(event.target.value) as TourneyContestType)}
					>
						{tourneyContestTypeValues.map((value, index) => <option key={index} value={value}>{TourneyContestType[value]}</option>)}
					</Form.Control>
				}
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Display Name"
					id="contestDisplayNameEditor"
					placeholder="Inherited From Majsoul"
					fallbackValue={contest.displayName}
					onCommit={(value) => {
						setDisplayName(value);
						return value;
					}} />
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Anthem"
					id="contestAnthemEditor"
					fallbackValue={contest.anthem}
					onCommit={(value) => {
						setAnthem(value);
						return value;
					}} />
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Spreadsheet ID"
					id="contestSpreadsheetIdEditor"
					fallbackValue={contest.spreadsheetId}
					onCommit={(value) => {
						setSpreadsheetId(value);
						return value;
					}} />
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Initial Phase Name"
					id="contestInitialPhaseName"
					fallbackValue={contest.initialPhaseName}
					onCommit={(value) => {
						setInitialPhaseName(value);
						return value;
					}} />
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Tagline"
					id="contestTaglineEditor"
					fallbackValue={contest.tagline}
					onCommit={(value) => {
						setTagline(value);
						return value;
					}} />
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Tagline Alternative"
					id="contestTaglineAltEditor"
					fallbackValue={contest.taglineAlternate}
					onCommit={(value) => {
						setTaglineAlternate(value);
						return value;
					}} />
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<TextField
					label="Bonus Per Game"
					id="contestBonusPerGameEditor"
					fallbackValue={contest.bonusPerGame?.toString() ?? ""}
					onChange={(oldValue, newValue) => {
						if (newValue === "") {
							return {
								value: null,
								isValid: true,
							};
						}
						const value = parseInt(newValue);
						return {
							isValid: value >= 0,
							value: newValue,
						}
					}}
					onCommit={(value: string, isValid: boolean) => {
						if (value == null) {
							if (value === null) {
								setBonusPerGame(null);
							}
							return value;
						}

						if (isValid) {
							const intValue = parseInt(value);
							setBonusPerGame(intValue);
							return intValue.toString();
						}

						if (bonusPerGame == null) {
							return bonusPerGame as null | undefined;
						}

						return bonusPerGame.toString();
					}}
				/>
			</Col>
		</Row>
		<Row className="no-gutters">
			<Col>
				<Form.Check
					inline
					label="Track"
					type="checkbox"
					id={`track-contest`}
					checked={track ?? contest.track ?? false}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrack(event.target.checked)}
				/>
			</Col>
			<Col className="text-right">
				<Button
					variant="secondary"
					disabled={(contest.majsoulFriendlyId === majsoulFriendlyId || majsoulFriendlyId === undefined)
						&& (contest.type === type || type === undefined)
						&& (contest.tourneyType === tourneyType || tourneyType === undefined)
						&& (contest.displayName === displayName || displayName === undefined)
						&& (contest.anthem === anthem || anthem === undefined)
						&& (contest.spreadsheetId === spreadsheetId || spreadsheetId === undefined)
						&& (contest.initialPhaseName === initialPhaseName || initialPhaseName === undefined)
						&& (contest.tagline === tagline || tagline === undefined)
						&& (contest.taglineAlternate === taglineAlternate || taglineAlternate === undefined)
						&& (contest.maxGames === maxGames || maxGames === undefined)
						&& (contest.bonusPerGame === bonusPerGame || bonusPerGame === undefined)
						&& (contest.track === track || track === undefined)
					}
					onClick={(event: any) => {
						patchContest(token, contest._id, {
							majsoulFriendlyId,
							initialPhaseName,
							tagline,
							taglineAlternate,
							anthem,
							type,
							tourneyType,
							maxGames,
							displayName,
							bonusPerGame,
							spreadsheetId,
							track
						}).then(contest => dispatchContestPatchedAction(dispatch, contest));
					}}
				>Save</Button>
			</Col>
		</Row>
		<ContestCustomGames contestId={props.contestId} />
	</Container>;
}
