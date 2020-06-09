import { Root, Method, RPCImplCallback, Type } from "protobufjs";
import { Subscription } from 'rxjs';
import { MajsoulCodec } from "./MajsoulCodec";
import { MessageType } from "./MessageType";
import { MajsoulConnection } from "./MajsoulConnection";
import { MajsoulService } from "./MajsoulService";

export class MajsoulRpcImplementation {
	private readonly transactionMap: {
		[key: number]: protobuf.RPCImplCallback;
	} = {};

	private readonly dataSubscription: Subscription;
	private readonly wrapper: Type;
	private index = 0;

	constructor(private readonly connection: MajsoulConnection, private readonly protobufRoot: Root) {
		this.wrapper = protobufRoot.lookupType('Wrapper');
		this.dataSubscription = connection.messages.subscribe((message) => {
			if (message.type !== MessageType.Response) {
				return;
			}
			const { index, data } = MajsoulCodec.stripIndex(message.data);
			const callback = this.transactionMap[index];
			delete this.transactionMap[index];
			if (!callback) {
				return;
			}
			try {
				const message = this.wrapper.decode(data)["data"];
				callback(null, message);
			}
			catch (error) {
				callback(error, null);
			}
		});
	}

	public getService(name: string): MajsoulService {
		return new MajsoulService(name, this.protobufRoot, (m, r, c) => this.rpcCall(m as Method, r, c));
	}

	private rpcCall(method: Method, requestData: Uint8Array, callback: RPCImplCallback) {
		const index = this.index++ % 60007;
		this.transactionMap[index] = callback;
		this.connection.send(MessageType.Request, MajsoulCodec.addIndex(index, this.wrapper.encode(this.wrapper.create({
			name: method.fullName,
			data: requestData
		})).finish()));
	}
}
