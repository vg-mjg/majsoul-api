import * as React from "react";
import { IState } from "../State";
import { useSelector, useDispatch } from "react-redux";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Han, RoundResult, AgariInfo } from "majsoul-api/dist/majsoul/types";
import { fetchYakuman } from "src/api/Games";
import { dispatchGamesRetrievedAction } from "src/actions/games/GamesRetrievedAction";
import * as dayjs from "dayjs";

function getYakumanName(han: Han[]): string {
	const names = han.map(h => {
		switch(h) {
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
				return "绿一色";
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
	return names.length ? names.join(" ") : "数え";
}

function getYakumanAgari(round: RoundResult): AgariInfo[] {
	if (round.tsumo) {
		if (round.tsumo.value === 32000 || round.tsumo.value === 48000) {
			return [round.tsumo];
		}
		return [];
	}

	if (!round.rons) {
		return []
	}

	return round.rons.filter(ron => ron.value === 32000 || ron.value === 48000);
}

export function YakumanDisplay(props: { contestId: string; }): JSX.Element {
	const dispatch = useDispatch();
	React.useEffect(() => {
		fetchYakuman(props.contestId)
			.then(games => dispatchGamesRetrievedAction(dispatch, games));
	}, [dispatch, props.contestId]);

	const games = useSelector((state: IState) => Object.values(state.games ?? {})
		.filter(game => game.contestId === props.contestId
			&& game.rounds?.find(round => getYakumanAgari(round).length > 0))
	);
	return <>
		<Row className="px-4 py-3 justify-content-end">
			<Col md="auto" className="h4 mb-0"><u>Yakuman Attained</u></Col>
		</Row>
		<Row>
			<Container className="rounded bg-dark text-light pt-2 px-3">
				{games.length > 0 ?
					games.map((game, i) => <Row
						className={`no-gutters align-items-center pb-1 mb-1`}
						key={game._id}
						style={i === games.length - 1 ? {} : { borderBottom: "solid white 1px" }}
					>
						<Col style={{ fontSize: "1.5em" }}>
							{game.rounds.map(getYakumanAgari).filter(agari => agari.length > 0).flat().map(agari => getYakumanName(agari.han)).join(" ")}
						</Col>

						<Col md="auto" className="mr-3">
							{dayjs(game.start_time).calendar()}
						</Col>

						<Col md="auto">
							<a href={`https://mahjongsoul.game.yo-star.com/?paipu=${game.majsoulId}`} rel="noreferrer" target="_blank">On Majsoul</a>
						</Col>
					</Row>
					)
					:
					<Row className={`no-gutters text-center pb-1 mb-1`}>
						<Col>
							<div className="h4 font-weight-bold m-0">未だ無し</div>
						</Col>
					</Row>}
			</Container>
		</Row>
	</>;
}
