import { Han } from "majsoul";

import { Wind } from "../store/enums";
import { AgariDetails, FinalHandState, FinalHandStateType, GameMetadata, RoundConclusionType, RoundMetadata } from "../store/GameMetadata";
import { UnifiedGameRecord } from "../store/UnifiedGameRecord";


export enum StyleMoveType {
	Unknown,

	Win,
	Mangan,
	Haneman,
	Baiman,
	Sanbaiman,
	Yakuman,

	Riichi,
	Dora,
	UraDora,
	AllSimples,
	SeatWind,
	PrevalentWind,
	RedDragon,
	WhiteDragon,
	GreenDragon,

	OpenPureStraight,
	ClosedPureStraight,
	OpenMixedTripleSequence,
	ClosedMixedTripleSequence,

	AllTriplets,
	PureDoubleSequence,
	HalfOutsideHand,
	OpenHalfFlush,
	ClosedHalfFlush,
	SevenPairs,
	FullyOutsideHand,
	Ippatsu,
	RobbingAKan,
	UnderTheSea,
	UnderTheRiver,
	DoubleRiichi,
	AfterAKan,
	ThreeConcealedTriplets,
	TwicePureDoubleSequence,
	TripleTriplets,
	OpenFullFlush,
	ClosedFullFlush,
	ThreeQuads,
	LittleThreeDragons,
	AllTerminalsAndHonors,
	ManganAtDraw,
	Red_Five,
}

export enum StyleMeterChangeType {
	Combo,
	Move,
	Penalty
}

enum StylePenaltyType {
	TripleRon,
}

export interface StylePenalty {
	type: StyleMeterChangeType.Penalty;
	penaltyType: StylePenaltyType;
	points: number;
}

export interface StyleMove {
	type: StyleMeterChangeType.Move;
	moveType: StyleMoveType;
	rawPoints: number;
	repetitionReduction: number;
	multiplier: number;
	actualPoints: number;
}

export enum StyleComboType {
	ChainWin,
	Idle,
	DamageTaken,
}

export interface StyleCombo {
	type: StyleMeterChangeType.Combo;
	comboType: StyleComboType;
	change: number;
}

export type StyleMeterChange = StyleMove | StyleCombo | StylePenalty;

export interface StyleBreakdown {
	total: number;
	moves: StyleMeterChange[];
}

interface StyleData {
	combo: number;
	total: number;
	attainedYaku: Record<Han, number>;
	moves: StyleMeterChange[];
}


function hanToStyleMoveType(han: Han, finalHandState: FinalHandState): StyleMoveType {
	switch (han) {

	case Han.Riichi:
		return StyleMoveType.Riichi;
	case Han.Dora:
		return StyleMoveType.Dora;
	case Han.Red_Five:
		return StyleMoveType.Red_Five;
	case Han.Ura_Dora:
		return StyleMoveType.UraDora;
	case Han.All_Simples:
		return StyleMoveType.AllSimples;
	case Han.Seat_Wind:
		return StyleMoveType.SeatWind;
	case Han.Prevalent_Wind:
		return StyleMoveType.PrevalentWind;
	case Han.Red_Dragon:
		return StyleMoveType.RedDragon;
	case Han.White_Dragon:
		return StyleMoveType.WhiteDragon;
	case Han.Green_Dragon:
		return StyleMoveType.GreenDragon;

	case Han.Pure_Straight: {
		if (finalHandState.state === FinalHandStateType.Open) {
			return StyleMoveType.OpenPureStraight;
		}
		return StyleMoveType.ClosedPureStraight;
	}

	case Han.Mixed_Triple_Sequence: {
		if (finalHandState.state === FinalHandStateType.Open) {
			return StyleMoveType.OpenMixedTripleSequence;
		}
		return StyleMoveType.ClosedMixedTripleSequence;
	}

	case Han.All_Triplets:
		return StyleMoveType.AllTriplets;

	case Han.Pure_Double_Sequence:
		return StyleMoveType.PureDoubleSequence;
	case Han.Half_Outside_Hand:
		return StyleMoveType.HalfOutsideHand;
	case Han.Half_Flush: {
		if (finalHandState.state === FinalHandStateType.Open) {
			return StyleMoveType.OpenHalfFlush;
		}
		return StyleMoveType.ClosedHalfFlush;
	}

	case Han.Seven_Pairs:
		return StyleMoveType.SevenPairs;

	case Han.Fully_Outside_Hand:
		return StyleMoveType.FullyOutsideHand;

	case Han.Ippatsu:
		return StyleMoveType.Ippatsu;

	case Han.Robbing_a_Kan:
		return StyleMoveType.RobbingAKan;

	case Han.Under_the_River:
		return StyleMoveType.UnderTheRiver;

	case Han.Double_Riichi:
		return StyleMoveType.DoubleRiichi;

	case Han.After_a_Kan:
		return StyleMoveType.AfterAKan;

	case Han.Under_the_Sea:
		return StyleMoveType.UnderTheSea;

	case Han.Three_Concealed_Triplets:
		return StyleMoveType.ThreeConcealedTriplets;

	case Han.Twice_Pure_Double_Sequence:
		return StyleMoveType.TwicePureDoubleSequence;

	case Han.Triple_Triplets:
		return StyleMoveType.TripleTriplets;

	case Han.Three_Quads:
		return StyleMoveType.ThreeQuads;

	case Han.Little_Three_Dragons:
		return StyleMoveType.LittleThreeDragons;

	case Han.All_Terminals_and_Honors:
		return StyleMoveType.AllTerminalsAndHonors;

	case Han.Mangan_at_Draw:
		return StyleMoveType.ManganAtDraw;

	case Han.Full_Flush: {
		if (finalHandState.state === FinalHandStateType.Open) {
			return StyleMoveType.OpenFullFlush;
		}
		return StyleMoveType.ClosedFullFlush;
	}

	}
	return StyleMoveType.Unknown;
}


const enum StylePointTier {
	None = 0,
	Minimum = 4,
	TierTwo = 8,
	TierThree = 20,
	TierFour = 40,
	TierFive = 60,
	TierSix = 80,
	TierSeven = 120,
	TierEight = 4000,
}

const rawPointsMap = {
	[StyleMoveType.Unknown]: StylePointTier.None,

	[StyleMoveType.Win]: StylePointTier.Minimum,
	[StyleMoveType.Riichi]: StylePointTier.Minimum,
	[StyleMoveType.Dora]: StylePointTier.Minimum,
	[StyleMoveType.Red_Five]: StylePointTier.Minimum,
	[StyleMoveType.UraDora]: StylePointTier.Minimum,
	[StyleMoveType.AllSimples]: StylePointTier.Minimum,
	[StyleMoveType.SeatWind]: StylePointTier.Minimum,
	[StyleMoveType.PrevalentWind]: StylePointTier.Minimum,
	[StyleMoveType.RedDragon]: StylePointTier.Minimum,
	[StyleMoveType.WhiteDragon]: StylePointTier.Minimum,
	[StyleMoveType.GreenDragon]: StylePointTier.Minimum,
	[StyleMoveType.OpenPureStraight]: StylePointTier.Minimum,
	[StyleMoveType.OpenMixedTripleSequence]: StylePointTier.Minimum,

	[StyleMoveType.AllTriplets]: StylePointTier.TierTwo,
	[StyleMoveType.PureDoubleSequence]: StylePointTier.TierTwo,
	[StyleMoveType.HalfOutsideHand]: StylePointTier.TierTwo,
	[StyleMoveType.ClosedMixedTripleSequence]: StylePointTier.TierTwo,
	[StyleMoveType.OpenHalfFlush]: StylePointTier.TierTwo,

	[StyleMoveType.Mangan]: StylePointTier.TierThree,
	[StyleMoveType.SevenPairs]: StylePointTier.TierThree,
	[StyleMoveType.FullyOutsideHand]: StylePointTier.TierThree,
	[StyleMoveType.ClosedPureStraight]: StylePointTier.TierThree,
	[StyleMoveType.ClosedHalfFlush]: StylePointTier.TierThree,
	[StyleMoveType.Ippatsu]: StylePointTier.TierThree,

	[StyleMoveType.Haneman]: StylePointTier.TierFour,
	[StyleMoveType.RobbingAKan]: StylePointTier.TierFour,
	[StyleMoveType.UnderTheSea]: StylePointTier.TierFour,
	[StyleMoveType.DoubleRiichi]: StylePointTier.TierFour,

	[StyleMoveType.AfterAKan]: StylePointTier.TierFive,
	[StyleMoveType.UnderTheRiver]: StylePointTier.TierFive,
	[StyleMoveType.ThreeConcealedTriplets]: StylePointTier.TierFive,
	[StyleMoveType.TwicePureDoubleSequence]: StylePointTier.TierFive,
	[StyleMoveType.TripleTriplets]: StylePointTier.TierFive,

	[StyleMoveType.Baiman]: StylePointTier.TierSix,
	[StyleMoveType.OpenFullFlush]: StylePointTier.TierSix,
	[StyleMoveType.ThreeQuads]: StylePointTier.TierSix,
	[StyleMoveType.LittleThreeDragons]: StylePointTier.TierSix,

	[StyleMoveType.Sanbaiman]: StylePointTier.TierSeven,
	[StyleMoveType.AllTerminalsAndHonors]: StylePointTier.TierSeven,
	[StyleMoveType.ClosedFullFlush]: StylePointTier.TierSeven,
	[StyleMoveType.ManganAtDraw]: StylePointTier.TierSeven,

	[StyleMoveType.Yakuman]: StylePointTier.TierEight,


	[StyleMoveType.GreenDragon]: StylePointTier.Minimum,
} as Record<StyleMoveType, StylePointTier>;

function getStyleTypeFromHandValue(handValue: number, isDealer: boolean): StyleMoveType {
	if (isDealer) {
		if (handValue >= 48000) {
			return StyleMoveType.Yakuman;
		}

		if (handValue >= 36000) {
			return StyleMoveType.Sanbaiman;
		}

		if (handValue >= 24000) {
			return StyleMoveType.Baiman;
		}

		if (handValue >= 18000) {
			return StyleMoveType.Haneman;
		}

		if (handValue >= 12000) {
			return StyleMoveType.Mangan;
		}

		return StyleMoveType.Win;
	}


	if (handValue >= 32000) {
		return StyleMoveType.Yakuman;
	}

	if (handValue >= 24000) {
		return StyleMoveType.Sanbaiman;
	}

	if (handValue >= 16000) {
		return StyleMoveType.Baiman;
	}

	if (handValue >= 12000) {
		return StyleMoveType.Haneman;
	}

	if (handValue >= 8000) {
		return StyleMoveType.Mangan;
	}

	return StyleMoveType.Win;
}

const ignoreMoveTypeTracking = {
	[StyleMoveType.Dora]: true,
	[StyleMoveType.UraDora]: true,
	[StyleMoveType.Red_Five]: true,

	[StyleMoveType.Riichi]: true,

	[StyleMoveType.Win]: true,
	[StyleMoveType.Mangan]: true,
	[StyleMoveType.Haneman]: true,
	[StyleMoveType.Baiman]: true,
	[StyleMoveType.Sanbaiman]: true,
	[StyleMoveType.Yakuman]: true,
} as Record<StyleMoveType, boolean>;

function processAgari(roundMetadata: RoundMetadata, agari: AgariDetails, styleData: Record<Wind, StyleData>): StyleMeterChange[] {
	const styles = [] as StyleMoveType[];

	styles.push(getStyleTypeFromHandValue(agari.baseHandCombinedValue, roundMetadata.dealer === agari.winner));

	styles.push(...agari.han.map(han => hanToStyleMoveType(han.han, roundMetadata.finalHandStates[agari.winner])));

	const styleMoves = styles.filter(style => style !== StyleMoveType.Unknown).map(style => ({
		type: StyleMeterChangeType.Move,
		moveType: style,
		rawPoints: rawPointsMap[style],
		repetitionReduction: rawPointsMap[style] / 4 * (styleData[agari.winner].attainedYaku[style] ?? 0),
		multiplier: styleData[agari.winner].combo,
	} as StyleMove)).filter(style => !!style.rawPoints);

	for (const styleMove of styleMoves) {
		styleMove.actualPoints = (styleMove.rawPoints - styleMove.repetitionReduction) * styleMove.multiplier;
	}

	const comboMoves = [] as StyleCombo[];

	comboMoves.push({
		type: StyleMeterChangeType.Combo,
		comboType: StyleComboType.ChainWin,
		change: 1,
	} as StyleCombo);

	for (const comboMove of comboMoves) {
		styleData[agari.winner].combo += comboMove.change;
	}

	return [...styleMoves, ...comboMoves];
}

function processRound(round: RoundMetadata, styleData: Record<Wind, StyleData>): Record<Wind, StyleMeterChange[]> {
	switch (round.conclusion.type) {
	case RoundConclusionType.Ryuukyoku: {
		break;
	} case RoundConclusionType.Ron: {
		const changes = round.conclusion.rons.reduce(
			(total, next) => (total[next.winner] = processAgari(round, next, styleData), total),
			{} as Record<Wind, StyleMeterChange[]>,
		);

		const loser = round.conclusion.rons[0].loser;
		changes[loser] = [];

		if (round.conclusion.rons.length > 2) {
			changes[loser].push({
				type: StyleMeterChangeType.Penalty,
				penaltyType: StylePenaltyType.TripleRon,
				points: styleData[loser].total,
			});
		}

		changes[loser].push({
			type: StyleMeterChangeType.Combo,
			comboType: StyleComboType.DamageTaken,
			change: -styleData[loser].combo,
		});


		return changes;
	} case RoundConclusionType.Tsumo: {
		const changes = {
			[round.conclusion.winner]: processAgari(round, round.conclusion, styleData),
		};

		return changes as Record<Wind, StyleMeterChange[]>;
	}
	}

	return {} as Record<Wind, StyleMeterChange[]>;
}

export function breakdownStyle(gameRecord: UnifiedGameRecord, gameMetadata: GameMetadata): Record<Wind, StyleBreakdown> {
	const styleData = {} as Record<Wind, StyleData>;

	for (const player of gameRecord.players) {
		styleData[player.seat] = {
			attainedYaku: {} as Record<Han, number>,
			combo: 0,
			total: 0,
			moves: [],
		};
	}

	for (const round of gameMetadata.rounds) {
		const changes = processRound(round, styleData);

		for (const idlePlayer of gameRecord.players.filter(player => !(player.seat in changes))) {
			if (styleData[idlePlayer.seat].combo === 0) {
				continue;
			}

			changes[idlePlayer.seat] ??= [];
			changes[idlePlayer.seat].push({
				type: StyleMeterChangeType.Combo,
				comboType: StyleComboType.Idle,
				change: -1,
			});
		}

		for (const key in changes) {
			const change = changes[key] as StyleMeterChange[];
			const playerStyleData = styleData[key] as StyleData;
			for (const item of change) {
				playerStyleData.moves.push(item);
				switch (item.type){
				case StyleMeterChangeType.Combo: {
					playerStyleData.combo += item.change;
					break;
				}
				case StyleMeterChangeType.Move: {
					playerStyleData.total += item.actualPoints;

					if (ignoreMoveTypeTracking[item.type]) {
						continue;
					}

					playerStyleData.attainedYaku[item.type] ??= 0;
					playerStyleData.attainedYaku[item.type]++;
					break;
				} case StyleMeterChangeType.Penalty: {
					playerStyleData.total -= item.points;
					break;
				}
				}
			}
		}
	}

	return Object.keys(styleData).reduce(
		(total, next) => (total[next] = { total: styleData[next].total, moves: styleData[next].moves }, total),
		{} as Record<Wind, StyleBreakdown>,
	);
}
