import { RestApi } from "./rest/RestApi.js";
import { getSecrets } from "./secrets.js";
import { Store } from "./store/Store.js";

async function main () {
	const secrets = getSecrets();
	const mongoStore = new Store();
	await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");

	const restApi = new RestApi(mongoStore);
	restApi.init(secrets.riichiRoot);
}

main();
