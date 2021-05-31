import * as React from "react";
import { Rest } from "majsoul-api";
import { Pie } from "./utils/Chart";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { StatsVersion } from "majsoul-api/dist/rest/types/stats/StatsVersion";
import { BaseStats } from "majsoul-api/dist/rest/types/stats/BaseStats";
import { AgariCategories, AgariStats, FirstStats } from "majsoul-api/dist/rest/types/stats/FirstStats";

function StatField(props: { label: string, value: string }): JSX.Element {
	return <Container>
		<Row className="no-gutters">
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
	color: GraphColor;
}

interface StatsPageProps {
	graphData: GraphSection[],
	centerColumn: StatDisplayProps[];
	rightColumn: StatDisplayProps[];
}

enum GraphColor {
	Red = "#921700",
	Black = "#161616",
	Green = "#006B24",
	White = "#DDDCDC",
}

function FirstStatsPage(props: StatsPageProps): JSX.Element {
	return <Row className="no-gutters">
		<Col>
			<Pie
				data={{
					labels: props.graphData.map(data => data.label),
					datasets: [{
						data: props.graphData.map(data => data.value),
						backgroundColor: props.graphData.map(data => data.color),
					}]
				}}
				options={{
					plugins: {
						legend: {
							display: false
						}
					}
				}}
			/>
		</Col>
		<Col>
			{props.centerColumn.map((stat, index) =>
				<StatField key={index} label={stat.label} value={stat.value} />
			)}
		</Col>
		<Col>
			{props.rightColumn.map((stat, index) =>
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

function FirstStatsDisplay({ stats }: { stats: FirstStats['stats'] }): JSX.Element {
	const [selectedPageType, setSelectedPageType] = React.useState(StatsPageType.Wins);
	const statsPagesByType = React.useMemo<Record<StatsPageType, StatsPageProps>>(() => {
		const totalWins = getAgariCategories(stats.wins).reduce((total, next) => total + next.total, 0);
		const totalWinsPercent = twoDecimalPlaceRound(
			100 * totalWins / stats.totalHands
		);
		const totalDrawsPercent = twoDecimalPlaceRound(100 * stats.draws.total / stats.totalHands);
		const totalDealinsPercent = twoDecimalPlaceRound(
			100 * getAgariCategories(stats.dealins).reduce(
				(total, next) => total + getAgariCategories(next).reduce((total, next) => total + next.total, 0),
				0
			) / stats.totalHands
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
						label: "Opponent Tsumo / Other",
						value: 100 - totalDealinsPercent - totalWinsPercent - totalDrawsPercent,
						color: GraphColor.White,
					},
				],
				centerColumn: [],
				rightColumn: []
			},
			[StatsPageType.Dealins]: {
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
						label: "Opponent Tsumo / Other",
						value: 100 - totalDealinsPercent - totalWinsPercent - totalDrawsPercent,
						color: GraphColor.White,
					},
				],
				centerColumn: [],
				rightColumn: []
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
				rightColumn: []
			}
		};
	}, [stats]);

	return <Container>
		<FirstStatsPage {...statsPagesByType[selectedPageType]} />
		<Row>
			<Col> Overall </Col>
			<Col> Calls </Col>
			<Col> Riichi </Col>
			<Col> Draws </Col>
			<Col> Dealins </Col>
			<Col> Wins </Col>
		</Row>
	</Container>
}

function BaseStatsDisplay(props: { stats: BaseStats['stats'] }): JSX.Element {
	if (!props.stats) {
		return null;
	}

	return null;
}

export function Stats(props: { stats: Rest.Stats }): JSX.Element {
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
