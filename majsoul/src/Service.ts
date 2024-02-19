import { RPCImpl, Root, Service, rpc } from "protobufjs";

export class RpcService {
	private readonly service: Service;

	private readonly rpcService: rpc.Service;
	private callChain: Promise<any> = Promise.resolve();

	constructor(name: string, private readonly protobufRoot: Root, rpcImplementation: RPCImpl) {
		this.service = this.protobufRoot.lookupService(`.lq.${name}`);
		this.rpcService = this.service.create(rpcImplementation);
	}

	public rpcCallImmediate(name: string, request: any): Promise<any> {
		const method = this.service.methods[name];
		return new Promise((resolve, reject) => {
			this.rpcService.rpcCall<any, any>(method, this.protobufRoot.lookupType(method.requestType).ctor, this.protobufRoot.lookupType(method.responseType).ctor, request, (error, data) => {
				if (error) {
					reject(error);
				}
				resolve(data);
			});
		});
	}

	public rpcCall<TReq = any, TRes = any>(name: string, request: TReq): Promise<TRes> {
		return this.callChain = this.callChain
			.then(() => this.rpcCallImmediate(name, request))
			.catch(() => this.rpcCallImmediate(name, request));
	}
}
