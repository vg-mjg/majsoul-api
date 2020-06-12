import { Root, rpc, RPCImpl, Service } from "protobufjs";

export class RpcService {
	private readonly service: Service;

	private readonly rpcService: rpc.Service;

	constructor(name: string, private readonly protobufRoot: Root, rpcImplementation: RPCImpl) {
		this.service = this.protobufRoot.lookupService(`.lq.${name}`);
		this.rpcService = this.service.create(rpcImplementation);
	}

	public rpcCall(name: string, request: any): Promise<any> {
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
}
