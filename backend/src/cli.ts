import * as fs from "fs";
import { CustomLobbyConnection, MajsoulApi } from "majsoul";
import * as path from "path";
import { getSecrets } from "./secrets.js";

async function main() {
	const secrets = getSecrets();
	const apiResources = await MajsoulApi.retrieveApiResources();
	const api = new MajsoulApi(apiResources);

	// console.log(api.majsoulCodec.decodeMessage(Buffer.from("", "hex"), "lq.Lobby.fetchCustomizedContestGameRecords"));

	await api.init();
	const loginData = await api.logIn({
		accessToken: secrets.majsoul.passportToken,
		uid: secrets.majsoul.uid,
	});
	// console.log(util.inspect(loginData, false, null, true));
	// return;
	const ids = await Promise.all([190550].map(id => api.findContestByContestId(id)));
	// const ids = await Promise.all([176745].map(id => api.findContestByContestId(id)));

	for (const id of ids) {
		console.log(await api.getContestGamesIds(id.majsoulId));
		api.subscribeToContestChatSystemMessages(id.majsoulId).subscribe(m => console.log(m));
		await new Promise<void>((resolve) => setTimeout(() => resolve(), 3000));
	}
	return

	const id = await api.getAccountIdFromFriendId("");
	const stats = await api.fetchAccountInfo(id);

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

	// const paipu = Codec.decodePaipuId("jmjqlq-1r5300x8-8638-67jb-ihma-hdfjkworksqr_a924986070_2").split("_")[0];
	// const game = await api.getGame(paipu);
	// const parsed = parseGameRecordResponse(game);

	// game.records = game.records.map(record => ({
	// 	...record,
	// 	_type: record.constructor.name.toString(),
	// } as any as GameStepRecord));


	api.dispose();
	//  await api.getGame(process.argv[0]);
	// console.log(game);
}

main().catch(e => console.log(e));
