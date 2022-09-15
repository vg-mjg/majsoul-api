import * as express from "express";
import  * as fs from "fs";
import { Codec, GameRecord, MajsoulApi } from "majsoul";
import { GameStepRecord } from "majsoul/dist/types/GameRecord";
import * as path from "path";
import * as util from "util";

import { breakdownStyle, StyleComboType, StyleMeterChangeType, StyleMoveType, StylePenaltyType } from "./connector/styleCalculator";
import { getSecrets } from "./secrets";
import { Wind } from "./store/enums";
import { buildGameMetadata } from "./store/GameMetadata";
import { unifyMajsoulGameRecord } from "./store/UnifiedGameRecord";

async function main() {
	const dataPath = path.join(process.cwd(), "/data/");
	if (!fs.existsSync(dataPath)){
		fs.mkdirSync(dataPath, { recursive: true });
	}

	const secrets = getSecrets();
	const apiResources = await MajsoulApi.retrieveApiResources();
	const api = new MajsoulApi(apiResources);

	await api.init();
	await api.logIn({
		accessToken: secrets.majsoul.passportToken,
		uid: secrets.majsoul.uid,
	});

	// const files = fs.readdirSync(dataPath);
	// for (const file of files) {
	// 	console.log(file);
	// 	const data = JSON.parse(fs.readFileSync(
	// 		path.join(dataPath, file),
	// 		{
	// 			encoding: "utf-8",
	// 		},
	// 	)) as GameRecord;

	// 	for (const record of data.records) {
	// 		record.constructor = function() {};
	// 		Object.defineProperty(record.constructor, "name", {value: (record as any)._type, writable: false});
	// 	}

	// 	const unifiedGame = unifyMajsoulGameRecord(data);
	// 	// console.log(unifiedGame);

	// 	const gameMetadata = buildGameMetadata(unifiedGame);
	// 	// console.log(gameMetadata);

	// 	const styleBreakdown = breakdownStyle(unifiedGame, gameMetadata);
	// 	console.log(util.inspect(styleBreakdown, false, null, true));

	// }


	const app = express();
	app.get("/:gameId", async (req, res) => {
		try {
			const paipu = (req.params.gameId.endsWith("_2") ? Codec.decodePaipuId(req.params.gameId) : req.params.gameId).split("_")[0];
			console.log(paipu);

			const filePath = path.join(dataPath, `${paipu}.json`);
			if (!fs.existsSync(filePath)) {
				console.log("fetching");
				const game = await api.getGame(paipu);
				delete game.data;
				game.records = game.records.map(record => ({
					...record,
					_type: record.constructor.name.toString(),
				} as any as GameStepRecord));

				fs.writeFileSync(
					filePath,
					JSON.stringify(game, null, "\t"),
					{
						flag: "w",
					},
				);
			}

			const data = JSON.parse(fs.readFileSync(
				filePath,
				{
					encoding: "utf-8",
				},
			)) as GameRecord;

			for (const record of data.records) {
				record.constructor = function() {};
				Object.defineProperty(record.constructor, "name", {value: (record as any)._type, writable: false});
			}

			const unifiedGame = unifyMajsoulGameRecord(data);
			// console.log(unifiedGame);

			const gameMetadata = buildGameMetadata(unifiedGame);
			// console.log(gameMetadata);

			const styleBreakdown = breakdownStyle(unifiedGame, gameMetadata);

			res.send(Object.keys(styleBreakdown).reduce(
				(total, next) => {
					// console.log(styleBreakdown[next].type);
					total[next] = {
						...styleBreakdown[next],
						moves: styleBreakdown[next].moves.map(move => ({
							...move,
							type: StyleMeterChangeType[move.type],
							moveType: StyleMoveType[move.moveType],
							penaltyType: StylePenaltyType[move.penaltyType],
							comboType: StyleComboType[move.comboType],
						})),
					};
					return total;
				},
				{},
			));
		} catch {
			res.status(500).send();
		}
	});

	app.listen(3575, () => console.log("Express started"));
}

main().catch(e => console.log(e));
