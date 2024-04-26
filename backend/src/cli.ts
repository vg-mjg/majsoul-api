import * as fs from "fs";
import { Codec, MajsoulApi } from "majsoul";
import { GameStepRecord } from "majsoul/dist/types/GameRecord.js";
import * as path from "path";
import * as util from "util";

import { getSecrets } from "./secrets.js";

async function main() {
	const secrets = getSecrets();
	const apiResources = await MajsoulApi.retrieveApiResources();
	const api = new MajsoulApi(apiResources);

	// console.log(api.majsoulCodec.decodeMessage(Buffer.from("", "hex"), "lq.Lobby.fetchAccountChallengeRankInfo"));

	await api.init();
	const loginData = await api.logIn({
		accessToken: secrets.majsoul.passportToken,
		uid: secrets.majsoul.uid,
	});
	// console.log(util.inspect(loginData, false, null, true));

	// return;

	const id = await api.getAccountIdFromFriendId("");
	const stats = await api.getAccountInformation(id);

	const dataPath = path.join(process.cwd(), "data");
	if (!fs.existsSync(dataPath)) {
		fs.mkdirSync(dataPath, { recursive: true });
	}

	fs.writeFileSync(
		path.join(dataPath, "cli.json"),
		JSON.stringify(stats, null, "\t"),
		{
			flag: "w",
		},
	);

	// const paipu = Codec.decodePaipuId("jijpnt-q3r346x6-y108-64fk-hbbn-lkptsjjyoszx_a925250810_2").split("_")[0];


	// const game = await api.getGame(paipu);
	// delete game.data;
	// game.records = game.records.map(record => ({
	// 	...record,
	// 	_type: record.constructor.name.toString(),
	// } as any as GameStepRecord));


	api.dispose();
	//  await api.getGame(process.argv[0]);
	// console.log(game);
}

main().catch(e => console.log(e));
