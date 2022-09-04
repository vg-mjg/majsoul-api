import { stylesheet } from "astroturf";
import type { Rest } from "backend";
import clsx from "clsx";
import * as dayjs from "dayjs";
import { Han } from "majsoul/dist/enums";
import * as React from "react";
import Accordion from "react-bootstrap/Accordion";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import { useTranslation } from "react-i18next";

import { fetchYakuman } from "../api/Games";
import { PaipuLink } from "./PaipuLink";
import globalStyles from "./styles.sass";

function getYakumanName(han: Han[]): string[] {
	const names = han.map(h => {
		switch (h) {
			case Han.Blessing_of_Heaven:
				return "天和";
			case Han.Blessing_of_Earth:
				return "地和";
			case Han.Big_Three_Dragons:
				return "大三元";
			case Han.Four_Concealed_Triplets:
				return "四暗刻";
			case Han.All_Honors:
				return "字一色";
			case Han.All_Green:
				return "緑一色";
			case Han.All_Terminals:
				return "清老頭";
			case Han.Thirteen_Orphans:
				return "国士無双";
			case Han.Four_Little_Winds:
				return "小四喜";
			case Han.Four_Quads:
				return "四槓子";
			case Han.Nine_Gates:
				return "九蓮宝燈";
			case Han.Eight_time_East_Staying:
				return "八連荘";
			case Han.True_Nine_Gates:
				return "純正九蓮宝燈";
			case Han.Single_wait_Four_Concealed_Triplets:
				return "四暗刻単騎";
			case Han.Thirteen_wait_Thirteen_Orphans:
				return "国士無双十三面待ち";
			case Han.Four_Big_Winds:
				return "大四喜";
			case Han.Hand_of_Man:
				return "人和";
			case Han.Big_Wheels:
				return "大車輪";
			case Han.Bamboo_Forest:
				return "大竹林";
			case Han.Numerous_Neighbours:
				return "大数隣";
			case Han.Ishinouenimosannen:
				return "石の上にも三年";
			case Han.Big_Seven_Stars:
				return "大七星";
		}
		return null;
	}).filter(h => h !== null);
	return names.length ? names : ["数え"];
}

const styles = stylesheet`
	.yakumanEntry {
		&:not(:last-child) {
			border-bottom: solid white 1px;
		}
	}
`;

function YakumanList(props: {yakumen: Rest.YakumanInformation[]}) {
	const { t } = useTranslation();
	return <Container className="p-0">
		{props.yakumen.length > 0 ?
			props.yakumen.map(({ game, han, player }, index) => <Row
				className={clsx("no-gutters align-items-center pb-1 mb-1", styles.yakumanEntry)}
				key={index}
			>
				<Col style={{ fontSize: "1.5em" }}>
					{getYakumanName(han).join(" ")}
				</Col>

				<Col md="auto" className="mr-3">
					{player.nickname}
				</Col>

				<Col md="auto" className="mr-3">
					{dayjs(game.endTime).calendar()}
				</Col>

				<Col md="auto">
					<PaipuLink majsoulId={game.majsoulId} />
				</Col>
			</Row>
			)
			:
			<Row className={"no-gutters text-center pb-1 mb-1"}>
				<Col>
					<div className="h4 font-weight-bold m-0">未だ無し</div>
				</Col>
			</Row>}
	</Container>;
}

const RECENT_LENGTH = 5;

export function YakumanDisplay(props: { contestId: string; }): JSX.Element {
	const { t } = useTranslation();
	const [yakumen, setYakumen] = React.useState<Rest.YakumanInformation[]>([]);
	const [activeTab, setActiveTab] = React.useState<string>(null);

	React.useEffect(() => {
		setYakumen([]);
		fetchYakuman(props.contestId).then((yakumen) => setYakumen(yakumen.reverse()));
	}, [props.contestId]);

	const yakumenSorted = React.useMemo(() => {
		if (!yakumen) {
			return [];
		}

		return Object.values(yakumen.reduce((total, next) => {
			for (const yaku of getYakumanName(next.han)) {
				total[yaku] ??= {
					yaku,
					yakumen: []
				};
				total[yaku].yakumen.push(next);
			}
			return total;
		}, {} as Record<string, {
			yaku: string,
			yakumen: Rest.YakumanInformation[]
		}>));
	}, [yakumen]);

	return <>
		<Row className="px-4 py-3 justify-content-end no-gutters">
			<Col md="auto" className="h4 mb-0"><u>{t("yakuman.attained")}</u></Col>
		</Row>
		<Row>
			<Container className="rounded bg-dark text-light pt-2">
				{ yakumen?.length >= RECENT_LENGTH && <Row className="no-gutters">
					<Col className="h6">
						<u>{t("yakuman.recent")}</u>
					</Col>
				</Row> }
				<Row>
					<Col>
						<YakumanList yakumen={yakumen.slice(0, RECENT_LENGTH)} />
					</Col>
				</Row>
			</Container>
		</Row>
		{ yakumen?.length >= RECENT_LENGTH && <Row className="mt-3">
			<Container className="rounded bg-dark text-light pt-2">
				<Row className="no-gutters py-1">
					<Col className="h6">
						<u>{t("yakuman.byType")}</u>
					</Col>
				</Row>
				<Row>
					<Col>
						<Accordion as={Container} activeKey={activeTab} onSelect={setActiveTab} className="p-0">
							{ yakumenSorted.map((type, index) => <React.Fragment key={type.yaku}>
								<Accordion.Toggle
									as={Row}
									eventKey={type.yaku}
									className={clsx("no-gutters align-items-center flex-nowrap pb-1 mb-1", globalStyles.linkDark, (activeTab === type.yaku || index < yakumenSorted.length - 1) && styles.yakumanEntry)}
									// onClick={() => setActiveTab(activeTab === Han[type.han] ? null : Han[type.han])}
									style={{ cursor: "pointer" }}
								>
									<Col style={{ fontSize: "1.35em" }}>
										<b>{type.yaku}</b>
									</Col>
									<Col md="auto" style={{ fontSize: "1.2em" }}>
										<b>{type.yakumen.length}</b>
									</Col>
								</Accordion.Toggle>
								<Accordion.Collapse as={Row} eventKey={type.yaku}>
									<YakumanList yakumen={type.yakumen}/>
								</Accordion.Collapse>
							</React.Fragment>) }
						</Accordion>
					</Col>
				</Row>
			</Container>
		</Row> }
	</>;
}
