import * as WebSocket from "ws";
import { Subject, Observable } from 'rxjs';
import { MajsoulCodec } from "./MajsoulCodec";
import { MessageType } from "./MessageType";

export class MajsoulConnection {
	private readonly messagesSubject = new Subject<any>();
	private socket: WebSocket;
	constructor(private readonly server) { }

	public get messages(): Observable<{
		type: MessageType;
		data: Buffer;
	}> {
		return this.messagesSubject;
	}

	public init(): Promise<void> {
		return this.reconnect();
	}

	private reconnect(): Promise<void> {
		if (this.socket) {
			this.socket.terminate();
		}

		console.log("Connecting to " + this.server);
		let agent = undefined;

		if (process.env.http_proxy) {
			console.log(`Using proxy ${process.env.http_proxy}`);
			const url = require("url");
			const HttpsProxyAgent = require("https-proxy-agent");
			agent = new HttpsProxyAgent(url.parse(process.env.http_proxy));
		}

		return new Promise((resolve) => {
			this.socket = new WebSocket(this.server, { agent });
			this.socket.on("message", (data) => {
				const message = MajsoulCodec.stripMessageType(data as Buffer);
				this.messagesSubject.next(message);
				this.socket.onerror = (event) => console.log(`websocker onerror`, event);
				this.socket.onclose = (event) => console.log(`websocker onclose`, event);
				this.socket.on("close", (a, b) => console.log(`websocket closed`, a, b));
				this.socket.on("error", (e) => console.log(`websocket error`, e));
				this.socket.on("open", () => resolve());
			});
		});
	}

	public send(type: MessageType, data: Uint8Array): void {
		if(this.socket.readyState !== WebSocket.OPEN) {
			throw new Error("Connection is not opened");
		}

		this.socket.send(MajsoulCodec.addMessageType(type, data));
	}

	public close() {
		this.socket.terminate()
	}
}
