import  * as fs from "fs";
import { Codec, MajsoulApi } from "majsoul";
import { GameStepRecord } from "majsoul/dist/types/GameRecord.js";
import * as path from "path";

import { getSecrets } from "./secrets.js";

async function main() {
	const secrets = getSecrets();
	const apiResources = await MajsoulApi.retrieveApiResources();
	const api = new MajsoulApi(apiResources);

	await api.init();
	await api.logIn({
		accessToken: secrets.majsoul.passportToken,
		uid: secrets.majsoul.uid,
	});

	const paipu = Codec.decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split("_")[0];

	const dataPath = path.join(process.cwd(), "data");
	if (!fs.existsSync(dataPath)){
		fs.mkdirSync(dataPath, { recursive: true });
	}

	const game = await api.getGame(paipu);
	delete game.data;
	game.records = game.records.map(record => ({
		...record,
		_type: record.constructor.name.toString(),
	} as any as GameStepRecord));

	fs.writeFileSync(
		path.join(dataPath, `${game.head?.uuid}.json`),
		JSON.stringify(game, null, "\t"),
		{
			flag: "w",
		},
	);

	api.dispose();
	//  await api.getGame(process.argv[0]);
	// console.log(game);
}

main().catch(e => console.log(e));
