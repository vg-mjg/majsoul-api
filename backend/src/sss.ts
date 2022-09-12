import  * as fs from "fs";
import { GameRecord } from "majsoul";
import * as path from "path";
import * as util from "util";

import { breakdownStyle } from "./connector/styleCalculator";
import { buildGameMetadata } from "./store/GameMetadata";
import { unifyMajsoulGameRecord } from "./store/UnifiedGameRecord";

async function main() {
	const dataPath = path.join(process.cwd(), "/data/");
	const files = fs.readdirSync(dataPath);
	for (const file of files) {
		console.log(file);
		const data = JSON.parse(fs.readFileSync(
			path.join(dataPath, file),
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
		console.log(util.inspect(styleBreakdown, false, null, true));

	}
}

main().catch(e => console.log(e));
