import * as React from "react";
import { Pie } from "../utils/Chart";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { AgariCategories } from "majsoul-api/dist/rest/types/stats/FirstStats";
import { css } from "astroturf";
import clsx from "clsx";
import * as globalStyles from "../styles.sass";
import { useTranslation } from "react-i18next";
import { KhanStats } from "majsoul-api/dist/rest/types/stats/KhanStats";

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
	stats: KhanStats['stats'];
}): JSX.Element {
	const [selectedPageType, setSelectedPageType] = React.useState(StatsPageType.Overall);

	const { t, i18n } = useTranslation();
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

		const callTabDetails = [
			{
				label: t("stats.calls.details.totalCallRate"),
				value: twoDecimalPlaceRound(100 * stats.calls.total / stats.calls.opportunities).toString() + "%",
			},
		];

		if (stats.calls.kans) {
			callTabDetails.push(
				{
					label: t("stats.calls.details.kans"),
					value: (stats.calls.kans.daiminkan + stats.calls.kans.ankan + stats.calls.kans.shouminkan - stats.calls.kans.shouminkanRobbed).toString(),
				}
			);
		}


		return {
			[StatsPageType.Overall]: {
				graphData: [
					{
						label: t("stats.overall.graph.wins"),
						data: [{
							value: totalWinsPercent,
							color: GraphColor.Green,
						}]
					},
					{
						label: t("stats.overall.graph.draws"),
						data: [{
							value: totalDrawsPercent,
							color: GraphColor.Black,
						}]
					},
					{
						label: t("stats.overall.graph.dealins"),
						data: [{
							value: totalDealinsPercent,
							color: GraphColor.Red,
						}]
					},

					{
						label: t("stats.overall.graph.other"),
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
							label: t("stats.overall.details.totalGames"),
							value: stats.gamesPlayed.toString(),
						},
						{
							label: t("stats.overall.details.averageRank"),
							value: twoDecimalPlaceRound(stats.totalRank / stats.gamesPlayed).toString(),
						},
						{
							label: t("stats.overall.details.averageShanten"),
							value: twoDecimalPlaceRound(stats.totalHaipaiShanten / stats.totalHands).toString()
						}
					]
				}
			},
			[StatsPageType.Dealins]: {
				graphData: [
					{
						label: t("stats.terminology.riichi"),
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
						label: t("stats.terminology.open"),
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
						label: t("stats.terminology.dama"),
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
					title: t("stats.dealins.detailsTitleMain"),
				},
				rightColumn: {
					title: t("stats.dealins.detailsTitleSecondary"),
				}
			},
			[StatsPageType.Wins]: {
				graphData: [
					{
						label: t("stats.terminology.riichi"),
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.riichi.total / totalWins),
							color: GraphColor.Green,
						}]
					},
					{
						label: t("stats.terminology.open"),
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.open.total / totalWins),
							color: GraphColor.Red,
						}]
					},
					{
						label: t("stats.terminology.dama"),
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
						label: t("stats.riichi.graph.won"),
						data: [{
							value: twoDecimalPlaceRound(100 * stats.wins.riichi.total / stats.riichi.total),
							color: GraphColor.Green,
						}]
					},
					{
						label: t("stats.riichi.graph.dealin"),
						data: [{
							value: twoDecimalPlaceRound(100 * dealinStats.riichi / stats.riichi.total),
							color: GraphColor.Red,
						}]
					},
					{
						label: t("stats.riichi.graph.tsumo"),
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
						label: t("stats.riichi.graph.draw"),
						data: [{
							value: twoDecimalPlaceRound(100 * stats.draws.riichi / stats.riichi.total),
							color: GraphColor.White,
						}]
					},
				],
				centerColumn: {
					title: t("stats.riichi.detailsTitleMain"),
					fields: [
						{
							label: t("stats.riichi.details.riichiRate"),
							value: twoDecimalPlaceRound(100 * stats.riichi.total / stats.totalHands).toString() + "%",
						},
					]
				},
				rightColumn: {
					fields: [
						{
							label: t("stats.riichi.details.uraPerRiichi"),
							value: twoDecimalPlaceRound(stats.uraDora / stats.wins.riichi.total).toString(),
						},
						{
							label: t("stats.riichi.details.riichiWithUra"),
							value: twoDecimalPlaceRound(100 * stats.riichi.uraHit / stats.wins.riichi.total).toString() + "%",
						},
						{
							label: t("stats.riichi.details.ippatsuRate"),
							value: twoDecimalPlaceRound(100 * stats.riichi.ippatsu / stats.riichi.total).toString() + "%",
						},
						{
							label: t("stats.riichi.details.firstRiichi"),
							value: twoDecimalPlaceRound(100 * stats.riichi.first / stats.riichi.total).toString() + "%",
						},
						{
							label: t("stats.riichi.details.chaseRiichi"),
							value: twoDecimalPlaceRound(100 * stats.riichi.chase / stats.riichi.total).toString() + "%",
						},
						{
							label: t("stats.riichi.details.riichiChased"),
							value: twoDecimalPlaceRound(100 * stats.riichi.chased / stats.riichi.total).toString() + "%",
						},
					]
				}
			},
			[StatsPageType.Calls]: {
				graphData: [
					{
						label: t("stats.calls.graph.callRate"),
						data: [{
							value: twoDecimalPlaceRound(100 * stats.calls.openedHands / stats.totalHands),
							color: GraphColor.Red,
						}]
					},
					{
						label: t("stats.calls.graph.riichiRate"),
						data: [{
							value: twoDecimalPlaceRound(100 * stats.riichi.total / stats.totalHands),
							color: GraphColor.Green,
						}]
					},
					{
						label: t("stats.calls.graph.closed"),
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
					fields: callTabDetails
				},
			}
		};
	}, [stats, i18n.language]);

	return <Container className={clsx("p-0")}>
		<FirstStatsPage {...statsPagesByType[selectedPageType]} />
		<Row>
			{Object.keys(statsPagesByType).map(type => parseInt(type)).map((type: StatsPageType) =>
				<Col key={type}>
					<SwapPageButton key={type} onClick={() => setSelectedPageType(type)} isSelected={type === selectedPageType}>
						{t(`stats.${StatsPageType[type].toLowerCase()}.tabTitle`)}
					</SwapPageButton>
				</Col>
			)}
		</Row>
	</Container>
});
