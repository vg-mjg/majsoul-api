import { RestApi } from "./rest/RestApi";
import { getSecrets } from "./secrets";
import { Store } from "./store/Store";

async function main () {
	const secrets = getSecrets();
	const mongoStore = new Store();
	await mongoStore.init(secrets.mongo?.username ?? "root", secrets.mongo?.password ?? "example");

	const restApi = new RestApi(mongoStore);
	restApi.init(secrets.riichiRoot);
}

main();
