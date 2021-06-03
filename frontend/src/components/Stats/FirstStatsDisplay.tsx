import * as React from "react";
import { Pie } from "../utils/Chart";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { AgariCategories, FirstStats } from "majsoul-api/dist/rest/types/stats/FirstStats";
import { css } from "astroturf";
import clsx from "clsx";
import * as globalStyles from "../styles.sass";

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

interface GraphData {
	value: number;
	color?: GraphColor;
}

interface GraphSection {
	label: string;
	data: GraphData[];
}

interface StatsGroup {
	title?: string;
	fields?: StatDisplayProps[];
}

interface StatsPageProps {
	graphData: GraphSection[],
	centerColumn?: StatsGroup;
	rightColumn?: StatsGroup;
}

enum GraphColor {
	Red = "#921700",
	Black = "#161616",
	Green = "#006B24",
	White = "#DDDCDC",
	AltRed = "#F42600",
	AltBlack = "#756C6C",
	AltGreen = "#00B33D",
	AltWhite = "#F5F5F5",
}

function StatsColumn(props: StatsGroup & {
	graphData: (GraphData & { label: string })[]
}): JSX.Element {
	console.log(props);
	return <Container>
		{props.title && <Row><Col className="font-weight-bold">{props.title}</Col></Row>}
		{props.graphData.map((stat) =>
			(stat.value != null) && <StatField key={stat.label} label={stat.label} value={stat.value.toString() + "%"} color={stat.color} />
		)}
		{props.fields?.map((stat) =>
			<StatField key={stat.label} label={stat.label} value={stat.value} />
		)}
	</Container>
}

function FirstStatsPage(props: StatsPageProps): JSX.Element {
	const datasets = props.graphData[0].data
		.map((_, index) => props.graphData.map(data => data.data[index])
			.reduce((total, next) => {
				total.data.push(next.value);
				total.backgroundColor.push(next.color);
				return total;
			}, { data: [] as number[], backgroundColor: [] as string[], label: index.toString() })
		);

	return <Row className="no-gutters py-3">
		<Col className={styles.statsContainer}>
			<div className="pr-2">
				<Pie
					data={{
						labels: props.graphData.map(dataSet => dataSet.label),
						datasets
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
			<StatsColumn
				{...(props.centerColumn ?? {})}
				graphData={props.graphData.map(({ label, data }) => ({ label, ...data[0] }))}
			/>
		</Col>
		<Col>
			<StatsColumn
				{...(props.rightColumn ?? {})}
				graphData={props.graphData.map(({ label, data }) => ({ label, ...data[1] }))}
			/>
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
	Riichi,
	Calls,
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

export const FirstStatsDisplay = React.memo(function ({
	stats,
}: {
	stats: FirstStats['stats'];
}): JSX.Element {
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

		// const riichi = {
		// 	won: stats.wins.riichi.total,
		// 	draw:
		// }

		const dealingOpponentStats = getAgariCategories(stats.dealins).reduce((total, next) => {
			total.dama += next.dama.total;
			total.riichi += next.riichi.total;
			total.open += next.open.total;
			return total;
		}, {
			dama: 0,
			riichi: 0,
			open: 0,
		})

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
						data: [{
							value: totalWinsPercent,
							color: GraphColor.Green,
						}]
					},
					{
						label: "Draws",
						data: [{
							value: totalDrawsPercent,
							color: GraphColor.Black,
						}]
					},
					{
						label: "Deal Ins",
						data: [{
							value: totalDealinsPercent,
							color: GraphColor.Red,
						}]
					},

					{
						label: "Other",
						data: [{
							value: twoDecimalPlaceRound(100 - totalDealinsPercent - totalWinsPercent - totalDrawsPercent),
							color: GraphColor.White,
						}]
					},
				],
				centerColumn: {},
				rightColumn: {
					fields: [
						{
							label: "Total Games",
							value: stats.gamesPlayed.toString(),
						},
						{
							label: "Average Rank",
							value: twoDecimalPlaceRound(stats.totalRank / stats.gamesPlayed).toString(),
						},
						{
							label: "Average Shanten",
							value: twoDecimalPlaceRound(stats.totalHaipaiShanten / stats.totalHands).toString()
						}
					]
				}
			},
			[StatsPageType.Dealins]: {
				graphData: [
					{
						label: "Riichi",
						data: [
							{
								value: twoDecimalPlaceRound(100 * dealinStats.riichi / totalDealins),
								color: GraphColor.Green,
							},
							{
								value: twoDecimalPlaceRound(100 * dealingOpponentStats.riichi / totalDealins),
								color: GraphColor.AltGreen,
							},
						]
					},
					{
						label: "Open",
						data: [
							{
								value: twoDecimalPlaceRound(100 * dealinStats.open / totalDealins),
								color: GraphColor.Red,
							},
							{
								value: twoDecimalPlaceRound(100 * dealingOpponentStats.open / totalDealins),
								color: GraphColor.AltRed,
							},
						]
					},
					{
						label: "Dama",
						data: [
							{
								value: twoDecimalPlaceRound(100 * dealinStats.dama / totalDealins),
								color: GraphColor.Black,
							},
							{
								value: twoDecimalPlaceRound(100 * dealingOpponentStats.dama / totalDealins),
								color: GraphColor.AltBlack,
							},
						]
					},
				],
				centerColumn: {
					title: "Own Hand"
				},
				rightColumn: {
					title: "Opponent's Hand"
				}
			},
			[StatsPageType.Wins]: {
				graphData: [
					{
						label: "Riichi",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.riichi.total / totalWins),
							color: GraphColor.Green,
						}]
					},
					{
						label: "Open",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.open.total / totalWins),
							color: GraphColor.Red,
						}]
					},
					{
						label: "Dama",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.dama.total / totalWins),
							color: GraphColor.Black,
						}]
					},
				],
				centerColumn: {},
				rightColumn: {}
			},
			[StatsPageType.Riichi]: {
				graphData: [
					{
						label: "Won",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.riichi.total / stats.riichi.total),
							color: GraphColor.Green,
						}]
					},
					{
						label: "Dealt In",
						data: [{
							value: twoDecimalPlaceRound(100 * dealinStats.riichi / stats.riichi.total),
							color: GraphColor.Red,
						}]
					},
					{
						label: "Outskilled",
						data: [{
							value: twoDecimalPlaceRound(100 * (
								stats.riichi.total
								- stats.draws.riichi
								- stats.wins.riichi.total
								- dealinStats.riichi
							) / stats.riichi.total),
							color: GraphColor.Black,
						}]
					},
					{
						label: "Draw",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.draws.riichi / stats.riichi.total),
							color: GraphColor.White,
						}]
					},
				],
				centerColumn: {
					title: "Riichi Result",
					fields: [
						{
							label: "Riichi Rate",
							value: twoDecimalPlaceRound(100 * stats.riichi.total / stats.totalHands).toString() + "%",
						},
					]
				},
				rightColumn: {
					fields: [
						{
							label: "Ura Per Riichi Won",
							value: twoDecimalPlaceRound(stats.uraDora / stats.wins.riichi.total).toString(),
						},
						{
							label: "Riichi Won With Ura",
							value: twoDecimalPlaceRound(100 * stats.riichi.uraHit / stats.wins.riichi.total).toString() + "%",
						},
						{
							label: "Ippatsu Rate",
							value: twoDecimalPlaceRound(100 * stats.riichi.ippatsu / stats.riichi.total).toString() + "%",
						},
						{
							label: "First Riichi",
							value: twoDecimalPlaceRound(100 * stats.riichi.first / stats.riichi.total).toString() + "%",
						},
						{
							label: "Chased",
							value: twoDecimalPlaceRound(100 * stats.riichi.chase / stats.riichi.total).toString() + "%",
						},
						{
							label: "Was Chased",
							value: twoDecimalPlaceRound(100 * stats.riichi.chased / stats.riichi.total).toString() + "%",
						},
					]
				}
			},
			[StatsPageType.Calls]: {
				graphData: [
					{
						label: "Call Rate",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.calls.openedHands / stats.totalHands),
							color: GraphColor.Red,
						}]
					},
					{
						label: "Riichi Rate",
						data: [{
							value: twoDecimalPlaceRound(100 * stats.riichi.total / stats.totalHands),
							color: GraphColor.Green,
						}]
					},
					{
						label: "Closed",
						data: [{
							value: twoDecimalPlaceRound(100 * (
								stats.totalHands
								- stats.riichi.total
								- stats.calls.openedHands
							) / stats.totalHands),
							color: GraphColor.Black,
						}]
					},
				],
				rightColumn: {
					fields: [
						{
							label: "Calls / Opportunities",
							value: twoDecimalPlaceRound(100 * stats.calls.total / stats.calls.opportunities).toString() + "%",
						},
					]
				},
			}
		};
	}, [stats]);

	return <Container className={clsx("p-0")}>
		<FirstStatsPage {...statsPagesByType[selectedPageType]} />
		<Row>
			{Object.keys(statsPagesByType).map(type => parseInt(type)).map((type: StatsPageType) =>
				<Col key={type}>
					<SwapPageButton key={type} onClick={() => setSelectedPageType(type)} isSelected={type === selectedPageType}>
						{StatsPageType[type]}
					</SwapPageButton>
				</Col>
			)}
		</Row>
	</Container>
});