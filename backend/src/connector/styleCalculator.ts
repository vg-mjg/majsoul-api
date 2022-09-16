import { Han } from "majsoul";

import { StylePenalty } from "../store";
import { AgariDetails, FinalHandState, FinalHandStateType, GameMetadata, RonDetails, RoundConclusionType, RoundMetadata } from "../store/GameMetadata";
import { StyleComboType } from "../store/types/enums/StyleComboType";
import { StyleMeterChangeType } from "../store/types/enums/StyleMeterChangeType";
import { StyleMoveType } from "../store/types/enums/StyleMoveType";
import { StylePenaltyType } from "../store/types/enums/StylePenaltyType";
import { Wind } from "../store/types/enums/Wind";
import { StyleBreakdown } from "../store/types/sss/StyleBreakdown";
import { StyleCombo } from "../store/types/sss/StyleCombo";
import { StyleMeterChange } from "../store/types/sss/StyleMeterChange";
import { StyleMove } from "../store/types/sss/StyleMove";
import { AbortionType, CallType, UnifiedGameLogEventType, UnifiedGameRecord } from "../store/UnifiedGameRecord";


interface StyleData {
	combo: number;
	total: number;
	attainedYaku: Record<Han, number>;
	moves: StyleMeterChange[];
}


function hanToStyleMoveType(han: Han, finalHandState: FinalHandState): StyleMoveType {
	switch (han) {

	case Han.Fully_Concealed_Hand:  {
		if (finalHandState.state === FinalHandStateType.Open) {
			return StyleMoveType.Unknown;
		}
		return StyleMoveType.FullyConcealedHand;
	}
	case Han.Riichi:
		return StyleMoveType.Riichi;
	case Han.Dora:
		return StyleMoveType.Dora;
	case Han.Red_Five:
		return StyleMoveType.RedFive;
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
	TierEight = 400,
}

const rawPointsMap = {
	[StyleMoveType.Unknown]: StylePointTier.None,

	[StyleMoveType.Win]: StylePointTier.Minimum,
	[StyleMoveType.Riichi]: StylePointTier.Minimum,
	[StyleMoveType.Dora]: StylePointTier.Minimum,
	[StyleMoveType.RedFive]: StylePointTier.Minimum,
	[StyleMoveType.UraDora]: StylePointTier.Minimum,
	[StyleMoveType.AllSimples]: StylePointTier.Minimum,
	[StyleMoveType.SeatWind]: StylePointTier.Minimum,
	[StyleMoveType.PrevalentWind]: StylePointTier.Minimum,
	[StyleMoveType.RedDragon]: StylePointTier.Minimum,
	[StyleMoveType.WhiteDragon]: StylePointTier.Minimum,
	[StyleMoveType.GreenDragon]: StylePointTier.Minimum,
	[StyleMoveType.OpenPureStraight]: StylePointTier.Minimum,
	[StyleMoveType.OpenMixedTripleSequence]: StylePointTier.Minimum,
	[StyleMoveType.OpenKan]: StylePointTier.Minimum,

	[StyleMoveType.AllTriplets]: StylePointTier.TierTwo,
	[StyleMoveType.PureDoubleSequence]: StylePointTier.TierTwo,
	[StyleMoveType.HalfOutsideHand]: StylePointTier.TierTwo,
	[StyleMoveType.ClosedMixedTripleSequence]: StylePointTier.TierTwo,
	[StyleMoveType.OpenHalfFlush]: StylePointTier.TierTwo,
	[StyleMoveType.ClosedKan]: StylePointTier.TierTwo,

	[StyleMoveType.Mangan]: StylePointTier.TierThree,
	[StyleMoveType.TripleRedFive]: StylePointTier.TierThree,
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

	[StyleMoveType.ShortcutToMangan]: StylePointTier.TierFour,
	[StyleMoveType.ShortcutToHaneman]: StylePointTier.TierFive,
	[StyleMoveType.DoubleRiichiIppatsu]: StylePointTier.TierSix,
	[StyleMoveType.FullyConcealedHand]: StylePointTier.TierTwo,
	[StyleMoveType.OpenFuritenTsumo]: StylePointTier.TierTwo,
	[StyleMoveType.ClosedFuritenTsumo]: StylePointTier.TierThree,
	[StyleMoveType.Tsubamegaeshi]: StylePointTier.TierTwo,

	[StyleMoveType.HadakaTanki]: StylePointTier.TierThree,
	[StyleMoveType.DoraHadakaTanki]: StylePointTier.TierFour,

	[StyleMoveType.FourKans]: StylePointTier.TierFive,
	[StyleMoveType.FourRiichi]: StylePointTier.TierSeven,

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
	[StyleMoveType.RedFive]: true,

	[StyleMoveType.Riichi]: true,

	[StyleMoveType.Win]: true,
	[StyleMoveType.Mangan]: true,
	[StyleMoveType.Haneman]: true,
	[StyleMoveType.Baiman]: true,
	[StyleMoveType.Sanbaiman]: true,
	[StyleMoveType.Yakuman]: true,

	[StyleMoveType.ClosedKan]: true,
	[StyleMoveType.OpenKan]: true,
} as Record<StyleMoveType, boolean>;

function processAgari(roundMetadata: RoundMetadata, agari: AgariDetails, styleData: Record<Wind, StyleData>): StyleMeterChange[] {
	const handState = roundMetadata.finalHandStates[agari.winner];

	if (handState.state === FinalHandStateType.Closed) {
		if (!agari.han.filter(({han}) => han !== Han.Pinfu && han !== Han.Dora && han !== Han.Red_Five && han !== Han.Fully_Concealed_Hand).length) {
			return [{
				type: StyleMeterChangeType.Penalty,
				penaltyType: StylePenaltyType.PinfuNomi,
				points: StylePointTier.TierSeven,
			}];
		}

		return [{
			type: StyleMeterChangeType.Penalty,
			penaltyType: StylePenaltyType.Dama,
			points: StylePointTier.TierSix,
		}];
	}

	const penalties = [] as StylePenalty[];
	if (handState.state === FinalHandStateType.Open) {
		penalties.push({
			type: StyleMeterChangeType.Penalty,
			penaltyType: StylePenaltyType.OpenHand,
			points: StylePointTier.Minimum,
		});
	}

	const styles = [] as StyleMoveType[];

	styles.push(getStyleTypeFromHandValue(agari.baseHandCombinedValue, roundMetadata.dealer === agari.winner));

	if (agari.han.filter(han => han.han === Han.Red_Five).length >= 3) {
		styles.push(StyleMoveType.TripleRedFive);
	}

	styles.push(...agari.han.map(han => hanToStyleMoveType(han.han, handState)));

	if (roundMetadata.conclusion.type === RoundConclusionType.Tsumo) {
		if (handState.furiten) {
			if (handState.state === FinalHandStateType.Open) {
				styles.push(StyleMoveType.OpenFuritenTsumo);
			} else {
				styles.push(StyleMoveType.ClosedFuritenTsumo);
			}
		}
	} else {
		const ronAgari = agari as RonDetails;
		if (ronAgari.tsubamegaeshi) {
			styles.push(StyleMoveType.Tsubamegaeshi);
		}
	}

	const chiitoiIndex = styles.indexOf(StyleMoveType.SevenPairs);
	if (chiitoiIndex >= 0) {
		const ura = styles.filter(style => style === StyleMoveType.UraDora).length;
		const dora = styles.filter(style => style === StyleMoveType.Dora).length;
		if (ura >= 2 && dora >= 2) {
			styles.splice(chiitoiIndex, 1);
			styles.push(StyleMoveType.ShortcutToHaneman);
		} else if (ura >= 2 || dora >= 2) {
			styles.push(StyleMoveType.ShortcutToMangan);
		}
	}

	if (agari.hand.length === 1) {
		if (agari.dora.indexOf(agari.hand[0]) >= 0) {
			styles.push(StyleMoveType.DoraHadakaTanki);
		} else {
			styles.push(StyleMoveType.HadakaTanki);
		}
	}

	const doubleRiichiIndex = styles.indexOf(StyleMoveType.DoubleRiichi);
	const ippatsuIndex = styles.indexOf(StyleMoveType.Ippatsu);
	if (doubleRiichiIndex >= 0 && ippatsuIndex >= 0) {
		styles.splice(doubleRiichiIndex, 1);
		styles.splice(ippatsuIndex, 1);
		styles.push(StyleMoveType.DoubleRiichiIppatsu);
	}

	const styleMoves = styles.filter(style => style !== StyleMoveType.Unknown).map(style => ({
		type: StyleMeterChangeType.Move,
		moveType: style,
		rawPoints: 0,
		repetitionReduction: 0,
		multiplier: 0,
	} as StyleMove));

	const comboMoves = [] as StyleCombo[];

	comboMoves.push({
		type: StyleMeterChangeType.Combo,
		comboType: StyleComboType.ChainWin,
		change: 1,
		final: 0,
	} as StyleCombo);

	return [...styleMoves, ...comboMoves];
}

function processRound(round: RoundMetadata, styleData: Record<Wind, StyleData>): Record<Wind, StyleMeterChange[]> {
	switch (round.conclusion.type) {
	case RoundConclusionType.Ryuukyoku: {
		break;
	} case RoundConclusionType.Abortion: {
		switch (round.conclusion.abortionType) {
		case AbortionType.FourKans: {
			return {
				[round.conclusion.player]: [{
					type: StyleMeterChangeType.Move,
					moveType: StyleMoveType.FourKans,
				}],
			} as Record<Wind, StyleMeterChange[]>;
		} case AbortionType.FourRiichi: {
			return {
				[round.conclusion.player]: [{
					type: StyleMeterChangeType.Move,
					moveType: StyleMoveType.FourRiichi,
				}],
			} as Record<Wind, StyleMeterChange[]>;
		}
		}
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
		} else {
			changes[loser].push({
				type: StyleMeterChangeType.Penalty,
				penaltyType: StylePenaltyType.Loss,
				points: StylePointTier.TierTwo,
			});
		}

		changes[loser].push({
			type: StyleMeterChangeType.Combo,
			comboType: StyleComboType.DamageTaken,
			change: -styleData[loser].combo,
			final: 0,
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
		const kanMoves = round.events.reduce(
			(total, next) => {
				if (next.type !== UnifiedGameLogEventType.CallMade) {
					return total;
				}

				const kanType = next.callType === CallType.Ankan
					? StyleMoveType.ClosedKan
					: (next.callType === CallType.Shouminkan || next.callType === CallType.Daiminkan)
						? StyleMoveType.OpenKan
						: StyleMoveType.Unknown;

				if (kanType === StyleMoveType.Unknown) {
					return total;
				}

				total[next.player] ??= [];
				total[next.player].push({
					type: StyleMeterChangeType.Move,
					moveType: kanType,
					actualPoints: rawPointsMap[kanType] * (styleData[next.player].combo + 1),
					multiplier: styleData[next.player].combo,
					rawPoints: rawPointsMap[kanType],
					repetitionReduction: 0,
				});
				return total;
			},
			{} as Record<Wind, StyleMove[]>,
		);

		const changes = processRound(round, styleData);

		for (const idlePlayer of gameRecord.players.filter(player => !changes[player.seat])) {
			if (styleData[idlePlayer.seat].combo <= 0) {
				continue;
			}

			changes[idlePlayer.seat] ??= [];
			changes[idlePlayer.seat].push({
				type: StyleMeterChangeType.Combo,
				comboType: StyleComboType.Idle,
				change: -1,
				final: 0,
			});
		}

		for (const player of gameRecord.players) {
			changes[player.seat] = [...kanMoves[player.seat] ?? [], ...(changes[player.seat] ?? [])];
		}

		for (const key in changes) {
			const change = changes[key] as StyleMeterChange[];
			const playerStyleData = styleData[key] as StyleData;
			for (const item of change) {
				playerStyleData.moves.push(item);
				switch (item.type){
				case StyleMeterChangeType.Combo: {
					playerStyleData.combo += item.change;
					item.final = playerStyleData.combo + 1;
					break;
				}
				case StyleMeterChangeType.Move: {
					item.rawPoints = rawPointsMap[item.moveType];
					item.repetitionReduction =  item.rawPoints / 4 * (playerStyleData.attainedYaku[item.moveType] ?? 0);
					item.multiplier = playerStyleData.combo + 1;
					item.actualPoints = (item.rawPoints - item.repetitionReduction) * item.multiplier;

					playerStyleData.total += item.actualPoints;

					if (ignoreMoveTypeTracking[item.type]) {
						continue;
					}

					playerStyleData.attainedYaku[item.type] ??= 0;
					playerStyleData.attainedYaku[item.type]++;
					break;
				} case StyleMeterChangeType.Penalty: {
					const actualAdjustment = Math.min(playerStyleData.total, item.points);
					item.points = actualAdjustment;
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
