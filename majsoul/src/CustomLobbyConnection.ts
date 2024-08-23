import { HttpsProxyAgent } from "https-proxy-agent";
import { Observable, Subject, tap } from "rxjs";
import url from "url";
import { TextEncoder } from "util";
import { WebSocket } from "ws";

let beatIndex = 0;

export class CustomLobbyConnection {
	private readonly messagesSubject = new Subject<any>();
	private readonly errorSubject = new Subject<any>();
	private socket: WebSocket;
	constructor(private readonly server: string) {
		this.errorSubject.pipe(
			tap(() => this.stopBeat())
		);
	}

	public get messages(): Observable<string> {
		return this.messagesSubject;
	}

	public get errors$(): Observable<any> {
		return this.errorSubject;
	}

	public init(): Promise<void> {
		console.log("init")
		return this.reconnect();
	}

	private heartbeat: {
		cancelled: boolean
	};

	private startBeat(heartbeat: { cancelled: boolean }) {
		console.log("startBeat");
		setTimeout(() => {
			if (heartbeat.cancelled || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
				return;
			}
			console.log("heartbeat", beatIndex++);
			this.send("<= heartbeat -");
			console.log("success");
			this.startBeat(heartbeat);
		}, 50000);
	}

	private stopBeat() {
		if (this.heartbeat) {
			this.heartbeat.cancelled = true;
		}
		this.heartbeat = null;
	}

	public reconnect(): Promise<void> {
		if (this.socket && !this.socket.CLOSED && !this.socket.CLOSING) {
			console.log("socket terminate");
			this.socket.terminate();
		}

		console.log("Connecting to " + this.server);
		let agent: HttpsProxyAgent = undefined;

		if (process.env.http_proxy) {
			console.log(`Using proxy ${process.env.http_proxy}`);
			agent = new HttpsProxyAgent(url.parse(process.env.http_proxy));
		}

		return new Promise((resolve) => {
			this.socket = new WebSocket(this.server, {
				agent,
				origin: "https://mahjongsoul.game.yo-star.com",
			});
			this.socket.on("message", (data) => {
				this.messagesSubject.next(String.fromCharCode(...(data as any)));
			});

			this.socket.onerror = (event) => {
				this.errorSubject.next(event);
				console.log("websocker onerror", event);
			};
			this.socket.onclose = (event) => {
				this.errorSubject.next(event);
			};
			this.socket.on("close", (e, r) => {
				console.log("close", e, String.fromCharCode(...(r as any)));
				this.errorSubject.next(null);
			});
			this.socket.on("error", (e) => {
				this.errorSubject.next(e);
				console.log("websocket error", e);
			});
			this.socket.on("open", () => {
				this.stopBeat();
				this.startBeat(
					this.heartbeat = {
						cancelled: false
					}
				);
				resolve();
			});
			this.socket.on("unexpected-response", () => {
				console.log("unexpected response");
			});
		});
	}

	public send(data: string): void {
		if (this.socket.readyState !== WebSocket.OPEN) {
			console.log("Connection is not opened");
			return;
		}

		const utf8Encode = new TextEncoder();
		this.socket.send(utf8Encode.encode(data));
	}

	public close() {
		this.socket.terminate();
	}
}
