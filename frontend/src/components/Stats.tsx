import * as React from "react";
import { Rest } from "majsoul-api";
import { Pie } from "./utils/Chart";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { StatsVersion } from "majsoul-api/dist/rest/types/stats/StatsVersion";
import { BaseStats } from "majsoul-api/dist/rest/types/stats/BaseStats";
import { AgariCategories, FirstStats } from "majsoul-api/dist/rest/types/stats/FirstStats";
import { css } from "astroturf";
import clsx from "clsx";
import * as globalStyles from "./styles.sass";

const styles = css`
	.chartContainer {
		box-sizing: border-box;
	}

	.colorBlip {
		border-radius: 50%;
		width: 1em;
		height: 1em;
	}
`;

function StatField(props: {
	label: string,
	value: string,
	color?: string
}): JSX.Element {
	return <Container className="p-0">
		<Row className="no-gutters align-items-center">
			{props.color && <Col sm="auto" className="mr-2"><div className={styles.colorBlip} style={{ backgroundColor: props.color }} /></Col>}
			<Col className="font-weight-bold text-left">{props.label}</Col>
			<Col sm="auto">{props.value}</Col>
		</Row>
	</Container>
}

interface StatDisplayProps {
	label: string;
	value: string;
}


interface GraphSection {
	label: string;
	value: number;
	color?: GraphColor;
}

interface StatsPageProps {
	graphData: GraphSection[],
	centerColumn: StatDisplayProps[];
	rightColumn: {
		fields: StatDisplayProps[];
	} & StatsPlayerProps
}

enum GraphColor {
	Red = "#921700",
	Black = "#161616",
	Green = "#006B24",
	White = "#DDDCDC",
}

function FirstStatsPage(props: StatsPageProps): JSX.Element {
	return <Row className="no-gutters py-3">
		<Col className={styles.statsContainer}>
			<div className="pr-4">
				<Pie
					data={{
						labels: props.graphData.map(data => data.label),
						datasets: [{
							data: props.graphData.map(data => data.value),
							backgroundColor: props.graphData.map(data => data.color),
						}]
					}}
					options={{
						aspectRatio: 1,
						plugins: {
							legend: {
								display: false
							}
						}
					}}
				/>
			</div>
		</Col>
		<Col>
			{props.graphData.map((stat) =>
				<StatField key={stat.label} label={stat.label} value={stat.value.toString() + "%"} color={stat.color} />
			)}
			{props.centerColumn.map((stat) =>
				<StatField key={stat.label} label={stat.label} value={stat.value} />
			)}
		</Col>
		<Col>
			{props.rightColumn.teamName && <div>{props.rightColumn.teamName}</div>}
			<div>{props.rightColumn.playerName}</div>
			{props.rightColumn.fields.map((stat, index) =>
				<StatField key={index} label={stat.label} value={stat.value} />
			)}
		</Col>
	</Row>
}

function getAgariCategories<T>(agariCategories: AgariCategories<T>): T[] {
	return [agariCategories.dama, agariCategories.open, agariCategories.riichi];
}

function twoDecimalPlaceRound(value: number): number {
	return Math.round(value * 100) / 100;
}

enum StatsPageType {
	Overall,
	Wins,
	Dealins,
}

function SwapPageButton(props: {
	onClick: () => void;
	children?: React.ReactNode
	isSelected?: boolean;
}): JSX.Element {
	return <div className={clsx(globalStyles.linkDark, "h5", props.isSelected && "font-weight-bold")} onClick={props.onClick}>
		{props.children}
	</div>
}

const FirstStatsDisplay = React.memo(function ({
	stats,
	teamName,
	playerName,
}: {
	stats: FirstStats['stats'];
} & StatsPlayerProps): JSX.Element {
	const [selectedPageType, setSelectedPageType] = React.useState(StatsPageType.Overall);
	const statsPagesByType = React.useMemo<Record<StatsPageType, StatsPageProps>>(() => {
		const totalWins = getAgariCategories(stats.wins).reduce((total, next) => total + next.total, 0);
		const totalWinsPercent = twoDecimalPlaceRound(
			100 * totalWins / stats.totalHands
		);
		const totalDrawsPercent = twoDecimalPlaceRound(100 * stats.draws.total / stats.totalHands);
		const dealinStats = {
			dama: getAgariCategories(stats.dealins.dama).reduce((total, next) => total + next.total, 0),
			open: getAgariCategories(stats.dealins.open).reduce((total, next) => total + next.total, 0),
			riichi: getAgariCategories(stats.dealins.riichi).reduce((total, next) => total + next.total, 0),
		}

		const totalDealins = getAgariCategories(stats.dealins).reduce(
			(total, next) => total + getAgariCategories(next).reduce((total, next) => total + next.total, 0),
			0
		);

		const totalDealinsPercent = twoDecimalPlaceRound(
			100 * totalDealins / stats.totalHands
		);

		return {
			[StatsPageType.Overall]: {
				graphData: [
					{
						label: "Wins",
						value: totalWinsPercent,
						color: GraphColor.Green,
					},
					{
						label: "Draws",
						value: totalDrawsPercent,
						color: GraphColor.Black,
					},
					{
						label: "Deal Ins",
						value: totalDealinsPercent,
						color: GraphColor.Red,
					},

					{
						label: "Other",
						value: twoDecimalPlaceRound(100 - totalDealinsPercent - totalWinsPercent - totalDrawsPercent),
						color: GraphColor.White,
					},
				],
				centerColumn: [],
				rightColumn: {} as any
			},
			[StatsPageType.Dealins]: {
				graphData: [
					{
						label: "Riichi",
						value: twoDecimalPlaceRound(100 * dealinStats.riichi / totalDealins),
						color: GraphColor.Green,
					},
					{
						label: "Open",
						value: twoDecimalPlaceRound(100 * dealinStats.open / totalDealins),
						color: GraphColor.Red,
					},
					{
						label: "Dama",
						value: twoDecimalPlaceRound(100 * dealinStats.dama / totalDealins),
						color: GraphColor.Black,
					},
				],
				centerColumn: [],
				rightColumn: {} as any
			},
			[StatsPageType.Wins]: {
				graphData: [
					{
						label: "Riichi",
						value: twoDecimalPlaceRound(100 * stats.wins.riichi.total / totalWins),
						color: GraphColor.Green,
					},
					{
						label: "Open",
						value: twoDecimalPlaceRound(100 * stats.wins.open.total / totalWins),
						color: GraphColor.Red,
					},
					{
						label: "Dama",
						value: twoDecimalPlaceRound(100 * stats.wins.dama.total / totalWins),
						color: GraphColor.Black,
					},
				],
				centerColumn: [],
				rightColumn: {} as any
			}
		};
	}, [stats]);

	return <Container className={clsx("p-0")}>
		<FirstStatsPage {...statsPagesByType[selectedPageType]} rightColumn={{ teamName, playerName, fields: [] }} />
		<Row>
			{Object.keys(statsPagesByType).map(type => parseInt(type)).map((type: StatsPageType) =>
				<Col>
					<SwapPageButton key={type} onClick={() => setSelectedPageType(type)} isSelected={type === selectedPageType}>
						{StatsPageType[type]}
					</SwapPageButton>
				</Col>
			)}
		</Row>
	</Container>
});

function BaseStatsDisplay(props: { stats: BaseStats['stats'] }): JSX.Element {
	if (!props.stats) {
		return null;
	}

	return null;
}

interface StatsPlayerProps {
	teamName?: string;
	playerName?: string;
}

export function VersionedStatsDisplay(props: { stats: Rest.Stats }) {
	if (props?.stats?.stats == null) {
		return null;
	}

	switch (props.stats.version) {
		case StatsVersion.None:
			return <BaseStatsDisplay stats={props.stats.stats} />
		case StatsVersion.First:
			return <FirstStatsDisplay stats={props.stats.stats} />
	}

	return null;
}

export function Stats(props: { stats: Rest.Stats, onSelectTeam?: () => void } & StatsPlayerProps): JSX.Element {
	return <Container className={clsx("p-0")}>
		<Row>
			<Col className="text-center">
				<span
					className={clsx("h5 font-weight-bold", globalStyles.linkDark)}
					onClick={() => props.onSelectTeam()}
				>{props.teamName}</span>&nbsp;
				<span className="h5">{props.playerName}</span>
			</Col>
		</Row>
		<Row>
			<VersionedStatsDisplay stats={props.stats} />
		</Row>
	</Container>
}
