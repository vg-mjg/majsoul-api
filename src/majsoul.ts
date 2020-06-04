import {Root, Method, RPCImplCallback, Type, rpc, RPCImpl, Service} from "protobufjs";
import * as WebSocket from "ws";
import * as uuidv4 from "uuid/v4";
import fetch from "node-fetch";
import { Subject, Observable, Subscription } from 'rxjs';
import { GameResult } from "./GameResult";
import { majsoul } from "./env";
import { IRoundResult, IAgariInfo, DrawStatus, IRoundInfo } from "./IHandRecord";
import * as util from 'util';
import { Han } from "./Han";

interface IContest {
  games: {
    id: string
  }[];
}

class MajsoulCodec {
  public static stripMessageType(data: Buffer): {type: MessageType, data: Buffer} {
    return {
      type: data[0],
      data: data.slice(1),
    };
  }

  public static addMessageType(type: MessageType, data: Uint8Array): Buffer {
    return Buffer.concat([
      Buffer.from([type]),
      data
    ])
  }

  public static stripIndex(data: Buffer): {index: number, data: Buffer} {
    return {
      index: data[0] | data[1] << 8,
      data: data.slice(2)
    }
  }

  public static addIndex(index: number, data: Uint8Array): Buffer {
    return Buffer.concat([
      Buffer.from([index & 0xff, index >> 8]),
      data,
    ]);
  }

  public static decode(root: Root, wrapper: Type, data: Buffer): any {
    const message = wrapper.decode(data);
    const type = root.lookupType(message["name"]);
    return type.decode(message["data"]);
  }

  private readonly wrapper: Type;

  constructor(private readonly protobufRoot: Root) {
    this.wrapper = protobufRoot.lookupType('Wrapper');
  }

  public decode(data: Buffer): any {
    return MajsoulCodec.decode(this.protobufRoot, this.wrapper, data);
  }

  public decodeMessage(message: Buffer, methodName?: string): {type: MessageType, index?: number, data: any} {
    const {type, data: wrappedData} = MajsoulCodec.stripMessageType(message);
    if (type === MessageType.Notification) {
      return {
        type,
        data: this.decode(wrappedData)
      };
    }

    if (type !== MessageType.Response && type !== MessageType.Request ) {
      console.log(`Unknown Message Type ${type}`);
      return;
    }

    const {index, data} = MajsoulCodec.stripIndex(wrappedData);
    const unwrappedMessage = this.wrapper.decode(data);
    const method = this.lookupMethod(methodName || unwrappedMessage["name"]);

    return {
      type,
      index,
      data: this.protobufRoot.lookupType(type === MessageType.Response
        ? method.requestType
        : method.requestType
        ).decode(unwrappedMessage["data"])
    }
  }

  private lookupMethod(path: string): Method {
    const sections = path.split(".");
    const service = this.protobufRoot.lookupService(sections.slice(0, -1));
    const name = sections[sections.length - 1];
    return service.methods[name];
  }
}

async function getRes<T>(path: string): Promise<T> {
  return (await fetch(path)).json();
}

enum MessageType {
  Notification = 1,
  Request = 2,
  Response = 3,
}

class MajsoulConnection {
  private readonly messagesSubject = new Subject<any>();
  private socket: WebSocket;

  constructor(private readonly server) {}

  public get messages(): Observable<{type: MessageType, data: Buffer}> {
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

    this.socket = new WebSocket(this.server, { agent });
    this.socket.on("message", (data) => {
      this.messagesSubject.next(MajsoulCodec.stripMessageType(data as Buffer));
    });

    return new Promise((resolve, reject) => {
      this.socket.on("open", () => resolve());
      this.socket.on("error", (e) => reject(e));
    });
  }

  public close () {
    this.socket.terminate();
  }

  public send(type: MessageType, data: Uint8Array): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Connection is not opened");
    }
    this.socket.send(MajsoulCodec.addMessageType(type, data));
  }
}

class MajsoulRpcImplementation {
  private readonly transactionMap: {[key: number]: protobuf.RPCImplCallback} = {};
  private readonly dataSubscription: Subscription;
  private readonly wrapper: Type;
  private index = 0;

  constructor(
    private readonly connection: MajsoulConnection,
    private readonly protobufRoot: Root,
  ){
    this.wrapper = protobufRoot.lookupType('Wrapper');

    this.dataSubscription = connection.messages.subscribe((message) => {
      if (message.type !== MessageType.Response) {
        return;
      }

      const {index, data} = MajsoulCodec.stripIndex(message.data);
      const callback = this.transactionMap[index];
      delete this.transactionMap[index];

      if (!callback) {
        return;
      }

      try {
        callback(null, this.wrapper.decode(data)["data"]);
      } catch (error){
        callback(error, null);
      }
    });
  }

  public getService(name: string): MajsoulService {
    return new MajsoulService(name, this.protobufRoot, (m, r, c) => this.rpcCall(m as Method, r, c))
  }

  private rpcCall(method: Method, requestData: Uint8Array, callback: RPCImplCallback){
    const index = this.index++ % 60007;
    this.transactionMap[index] = callback;
    this.connection.send(
      MessageType.Request,
      MajsoulCodec.addIndex(
        index,
        this.wrapper.encode(this.wrapper.create({
          name: method.fullName,
          data: requestData
        })).finish()
      )
    );
  }
}

class MajsoulService {
  private readonly service: Service;
  private readonly rpcService: rpc.Service;
  constructor(
    name: string,
    private readonly protobufRoot: Root,
    rpcImplementation: RPCImpl,
  ){
    this.service = this.protobufRoot.lookupService(`.lq.${name}`);
    this.rpcService = this.service.create(rpcImplementation);
  }

  public rpcCall(name: string, request: any): Promise<any> {
    const method = this.service.methods[name];
    return new Promise((resolve, reject) => {
      this.rpcService.rpcCall<any, any>(
        method,
        this.protobufRoot.lookupType(method.requestType).ctor,
        this.protobufRoot.lookupType(method.responseType).ctor,
        request,
        (error, data) => {
          if (error) {
            reject(error);
          }
          resolve(data);
        },
      )
    });
  }
}

export class MajsoulAPI {
  private rpc: MajsoulRpcImplementation;
  private protobufRoot: Root;
  private connection: MajsoulConnection;
  private lobbyService: MajsoulService;
  private codec: MajsoulCodec;

  public get majsoulCodec(): MajsoulCodec {
    return this.codec;
  }

  public async init(): Promise<void> {
    const URL_BASE = majsoul.urlBase || "https://mahjongsoul.game.yo-star.com/";
    const versionInfo = await getRes<any>(URL_BASE + "version.json?randv=" + Math.random().toString().slice(2));
    const resInfo = await getRes<any>(URL_BASE + `resversion${versionInfo.version}.json`);
    const pbVersion = resInfo.res["res/proto/liqi.json"].prefix;
    const pbDef = await getRes<any>(URL_BASE + `${pbVersion}/res/proto/liqi.json`);
    const config = await getRes<any>(URL_BASE + `${resInfo.res["config.json"].prefix}/config.json`);
    const ipDef = config.ip.filter((x) => x.name === "player")[0];

    const serverListUrl = (
      ipDef.region_urls.mainland
      || ipDef.region_urls[Object.keys(ipDef.region_urls)[0]]
    ) + "?service=ws-gateway&protocol=ws&ssl=true";

    const serverList = await getRes<any>(serverListUrl);
    if (serverList.maintenance) {
      console.log("Maintenance in progress");
      return;
    }

    const serverIndex = Math.floor(Math.random() * serverList.servers.length);
    this.connection = new MajsoulConnection(`wss://${serverList.servers[serverIndex]}`);
    this.protobufRoot = Root.fromJSON(pbDef);
    this.codec = new MajsoulCodec(this.protobufRoot);
    this.rpc = new MajsoulRpcImplementation(this.connection, this.protobufRoot);
    await this.connection.init();

    this.lobbyService = this.rpc.getService("Lobby");

    const passport = await (await fetch(
      "https://passport.mahjongsoul.com/user/login",
      {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "uid": majsoul.uid,
          "token": majsoul.accessToken,
          "deviceId": `web|${majsoul.uid}`
        })
      }
    )).json();

    if (!passport) {
      console.log("no passport")
      return;
    }

    const type = 8;
    let resp = await this.lobbyService.rpcCall("oauth2Auth", {
      type,
      code: passport.accessToken,
      uid: passport.uid,
    });
    const accessToken = resp.access_token;

    resp = await this.lobbyService.rpcCall("oauth2Check", {type, access_token: accessToken});
    if (!resp.has_account) {
      await new Promise((res) => setTimeout(res, 2000));
      resp = await this.lobbyService.rpcCall("oauth2Check", {type, access_token: accessToken});
    }

    resp = await this.lobbyService.rpcCall("oauth2Login", {
      type,
      access_token: accessToken,
      reconnect: false,
      device: { device_type: "pc", browser: "safari" },
      random_key: uuidv4(),
      client_version: versionInfo.version,
    });
    console.log("Connection ready");
  };

  public async getContest (contestId): Promise<IContest> {
    let resp = await this.lobbyService.rpcCall("fetchCustomizedContestByContestId", {
      contest_id: contestId,
    });
    const realId = resp.contest_info.unique_id;
    let nextIndex = undefined;
    const idLog = {};

    while (true) {
      resp = await this.lobbyService.rpcCall("fetchCustomizedContestGameRecords", {
        unique_id: realId,
        last_index: nextIndex,
      });

      for (const game of resp.record_list) {
        idLog[game.uuid] = true;
      }

      if (!resp.next_index || !resp.record_list.length) {
        break;
      }
      nextIndex = resp.next_index;
    }

    return {
      games: Object.keys(idLog).map(id => { return  {id} }).reverse()
    }
  }

  private getAgariRecord(record: any, hule: any, round: IRoundInfo): IAgariInfo {
    const value = hule.zimo
    ? (hule.seat === round.dealership
      ? hule.point_zimo_xian * 3
      : hule.point_zimo_qin + hule.point_zimo_xian * 2)
      : hule.point_rong - (hule.riqi ? 1000 : 0);

    if (hule.seat === round.dealership && hule.zimo) {
      console.log(util.inspect(record, false, null, true));
      console.log(value);
    }
    return {
      extras: record.delta_scores[hule.seat] - value - (hule.riqi ? 1000 : 0),
      value,
      winner: hule.seat,
      han: (hule.fans as any[]).map(f => {
        if ([Han.Dora, Han.Red_Five, Han.Ura_Dora].indexOf(f.id) >= 0) {
          return Array(f.val).fill(f.id);
        }
        return [f.id];
      }).flat()
    };
  }

  public async getGame(id: string): Promise<GameResult> {
    const resp = (await this.lobbyService.rpcCall("fetchGameRecord", { game_uuid: id }));
    const records = this.codec.decode(resp.data).records.map((r) => this.codec.decode(r));
    const hands: IRoundResult[] = [];

    let lastDiscardSeat: number;
    let round: IRoundInfo;
    for (const record of records) {
      switch (record.constructor.name) {
        case "RecordNewRound":
          round = {
            round: record.chang,
            dealership: record.ju,
            repeat: record.ben
          };
          break;
        case "RecordDiscardTile": {
          lastDiscardSeat = record.seat;
          break;
        }
        case "RecordNoTile": {
          if (!round) {
            console.log("Missing hand for NoTile event");
            continue;
          }

          hands.push({
            round,
            draw: {
              playerDrawStatus: (record.players as any[]).map((player, index) => {
                if (record.liujumanguan && (record.scores as any[]).find(score => score.seat === index)) {
                  return DrawStatus.Nagashi_Mangan;
                }
                return player.tingpai ? DrawStatus.Tenpai :  DrawStatus.Noten;
              })
            }
          });
          round = null;
          break;
        }
        case "RecordHule": {
          if (!round) {
            console.log("Missing hand for Hule event");
            continue;
          }

          if (record.hules[0].zimo) {
            const hule = record.hules[0];
            hands.push({
              round,
              tsumo: {
              ...this.getAgariRecord(record, hule, round),
              dealerValue: hule.point_zimo_qin,
              }
            });
            round = null;
            break;
          }

          hands.push( {
            round,
            rons: (record.hules as any[]).map(hule => {
              return {
                ...this.getAgariRecord(record, hule, round),
                loser: lastDiscardSeat
              }
            })
          });
          lastDiscardSeat = null;
          round = null;
          break;
        }
      }
    }

    if (!resp.data_url && !(resp.data && resp.data.length)) {
      console.log(`No data in response: ${id}`);
      return;
    }

    const result = resp.head.result.players;

    return {
      id,
      time: resp.head.end_time,
      players: (resp.head.accounts as any[]).map(account => {
        return {
          name: account.nickname
        }
      }),
      finalScore: (resp.head.accounts as any[]).map(account => {
        const playerItem = result.find(b => b.seat === account.seat);
        return {
          score: playerItem.part_point_1,
          uma: playerItem.total_point / 1000,
        }
      }),
      rounds: hands
    };
  }

  public dispose() {
    this.connection.close();
  }
}
