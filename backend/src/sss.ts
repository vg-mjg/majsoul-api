import  * as fs from "fs";
import { GameRecord } from "majsoul";
import * as path from "path";

async function main() {
	const dataPath = path.join(process.cwd(), "/data/");
	const files = fs.readdirSync(dataPath);
	for (const file of files) {
		console.log(file);
		const data = JSON.parse(fs.readFileSync(
			path.join(dataPath, file),
			{
				encoding: "utf-8"
			}
		)) as GameRecord;
		console.log(data);
	}
}

main().catch(e => console.log(e));
