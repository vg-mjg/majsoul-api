import { HttpsProxyAgent } from "https-proxy-agent";
import { Observable, Subject } from "rxjs";
import url from "url";
import { WebSocket } from "ws";

export class CustomLobbyConnection {
	private readonly messagesSubject = new Subject<any>();
	private readonly errorSubject = new Subject<any>();
	private socket: WebSocket;
	constructor(private readonly server: string) { }

	public get messages(): Observable<string> {
		return this.messagesSubject;
	}

	public get errors$(): Observable<any> {
		return this.errorSubject;
	}

	public init(): Promise<void> {
		return this.reconnect();
	}

	public reconnect(): Promise<void> {
		if (this.socket && !this.socket.CLOSED && !this.socket.CLOSING) {
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
			this.socket.on("close", () => {
				this.errorSubject.next(null);
			});
			this.socket.on("error", (e) => {
				this.errorSubject.next(e);
				console.log("websocket error", e);
			});
			this.socket.on("open", () => resolve());
		});
	}

	public send(data: string): void {
		if (this.socket.readyState !== WebSocket.OPEN) {
			throw new Error("Connection is not opened");
		}

		this.socket.send(data);
	}

	public close() {
		this.socket.terminate();
	}
}
