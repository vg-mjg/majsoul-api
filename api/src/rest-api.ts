import { RestApi } from "./rest/RestApi.js";
import * as store from "./store/index.js";
import { getSecrets } from "./secrets.js";

async function main () {
	const secrets = getSecrets();
	const mongoStore = new store.Store();
	await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");

	const restApi = new RestApi(mongoStore);
	restApi.init(secrets.riichiRoot);
}

main();
