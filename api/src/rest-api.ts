import { RestApi } from "./rest/RestApi";
import * as store from "./store";
import { getSecrets } from "./secrets";

async function main () {
	const secrets = getSecrets();
	const mongoStore = new store.Store();
	await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");

	const restApi = new RestApi(mongoStore);
	restApi.init(secrets.riichiRoot);
}

main();