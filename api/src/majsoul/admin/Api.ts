import { Root } from "protobufjs";
import fetch from "node-fetch";
import { Codec } from "../Codec";
import { Connection } from "../Connection";
import { RpcImplementation } from "../RpcImplementation";
import { RpcService } from "../Service";
import * as proto from "./types/proto.json";
import { lq } from "./types/proto";

export class Api {
	private static async getRes<T>(path: string): Promise<T> {
		return (await fetch(path)).json();
	}

	private readonly protobufRoot: Root;
	private readonly connection: Connection;
	private readonly rpc: RpcImplementation;
	private readonly contestManagerApiService: RpcService;
	private readonly codec: Codec;

	constructor() {
		console.log(proto);
		this.protobufRoot = Root.fromJSON(proto as any);
		this.codec = new Codec(this.protobufRoot);
		this.connection = new Connection("wss://mjusgs.mahjongsoul.com:9443/");
		this.rpc = new RpcImplementation(this.connection, this.protobufRoot);
		this.contestManagerApiService = this.rpc.getService("CustomizedContestManagerApi");
	}

	public get majsoulCodec(): Codec {
		return this.codec;
	}

	public async init(): Promise<void> {
		await this.connection.init();
	}

	public async logIn(userId: string, accessToken: string): Promise<void> {
		const passport = await (await fetch("https://passport.mahjongsoul.com/user/login", {
			method: "POST",
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				"uid": userId,
				"token": accessToken,
				"deviceId": `web|${userId}`
			})
		})).json();
		if (!passport) {
			console.log("no passport");
			return;
		}

		const type = 8;

		const respOauth2Auth = await this.contestManagerApiService.rpcCall<lq.IReqContestManageOauth2Auth, lq.IResContestManageOauth2Auth>("oauth2AuthContestManager", {
			type,
			code: passport.accessToken,
			uid: passport.uid,
		});

		const reqOauth2Check: lq.IReqContestManageOauth2Login = {
			type,
			access_token: respOauth2Auth.access_token
		}

		const respOauth2Check = await this.contestManagerApiService.rpcCall<lq.IReqContestManageOauth2Login, lq.IResContestManageOauth2Login>("oauth2LoginContestManager", reqOauth2Check);
		console.log(respOauth2Check);
	}

	public manageContest(contestId: number): Promise<lq.IResManageContest> {
		return this.contestManagerApiService.rpcCall<lq.IReqManageContest, lq.IResManageContest>("manageContest", {
			unique_id: contestId
		});
	}

	public fetchContestPlayers(): Promise<lq.IResFetchCustomizedContestPlayer> {
		return this.contestManagerApiService.rpcCall<lq.IReqCommon, lq.IResFetchCustomizedContestPlayer>("fetchContestPlayer", {});
	}

	public reconnect(): Promise<void> {
		return this.connection.reconnect();
	}

	public disconnect() {
		this.connection.close();
	}

	public dispose() {
		this.connection.close();
	}
}
