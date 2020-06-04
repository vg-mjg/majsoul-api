import * as protobuf from "protobufjs";
import * as assert from "assert";
import * as WebSocket from "ws";
import * as uuidv4 from "uuid/v4";
import fetch from "node-fetch";
import { Subject } from 'rxjs';
import { GameResult } from "./GameResult";
import { majsoul } from "./env";
import { IHandRecord, IAgariInfo, DrawStatus } from "./IHandRecord";
import { Han } from "./Han";

interface IMessage {
  type: number,
  reqIndex: number,
  methodName: string,
  payload: any,
}

interface IVersion {
  version: string;
}

async function getRes<T>(path: string): Promise<T> {
  return (await fetch(path)).json();
}

class MajsoulProtoCodec {
  private static readonly REQUEST = 2;
  private static readonly RESPONSE = 3;

  root: protobuf.Root;
  _index: number;
  wrapper: any;
  version: string;
  rawDefinition: any;

  constructor (pbDef, version: string) {
    this.root = protobuf.Root.fromJSON(pbDef);
    this._index = 1;
    this.wrapper = (this.root.nested.lq as any).Wrapper;
    this.version = version;
    this.rawDefinition = pbDef;
  }

  lookupMethod (path) {
    if (typeof path === "string") {
      path = path.split(".");
    }
    if (0 === path.length) {
      return null;
    }
    const service = this.root.lookupService(path.slice(0, -1));
    if (!service) {
      return null;
    }
    const name = path[path.length - 1];
    return service.methods[name];
  }

  public getIndex(buf: Buffer): number {
    return buf[1] | (buf[2] << 8);
  }

  public getType(buf: Buffer): number {
    return buf[0];
  }

  public getPayload(buf: Buffer): any {

  }

  public decode(buffer: Buffer): any {
    const msg = this.wrapper.decode(buffer);
    const typeObj = this.root.lookupType(msg.name);
    return typeObj.decode(msg.data);
  }

  public decodeMessage(buf: Buffer, decoder?: IDecoder): IMessage {
    const type = this.getType(buf);
    const reqIndex = this.getIndex(buf);
    const msg = this.wrapper.decode(buf.slice(3));

    let typeObj, methodName;
    if (type === MajsoulProtoCodec.REQUEST) {
      methodName = msg.name;
      const methodObj = this.lookupMethod(msg.name);
      const typeName = methodObj.requestType;
      typeObj = methodObj.parent.parent.lookupType(typeName);
    } else {
      if(!decoder) {
        throw new Error(`Unknown request ${reqIndex}`);
      }
      typeObj = decoder.responseType;
      methodName = decoder.methodName;
    }

    return {
      type,
      reqIndex,
      methodName,
      payload: typeObj.decode(msg.data),
    };
  }

  decodeDataMessage(buf, typeName) {
    const msg = this.wrapper.decode(buf);
    const typeObj = this.root.lookupType(typeName || msg.name);
    return {
      dataType: msg.name,
      payload: typeObj.decode(msg.data),
    };
  }

  encodeRequest ({ methodName, payload }): {buffer: Buffer, index: number, decoder: IDecoder} {
    const currentIndex = this._index++;
    const methodObj = this.lookupMethod(methodName);
    const requestType = methodObj.parent.parent.lookupType(methodObj.requestType);
    const responseType = methodObj.parent.parent.lookupType(methodObj.responseType);
    const msg = this.wrapper.encode({
      name: methodName,
      data: requestType.encode(payload).finish(),
    }).finish();
    return {
      buffer: Buffer.concat([
        Buffer.from([MajsoulProtoCodec.REQUEST, currentIndex & 0xff, currentIndex >> 8]),
        msg,
      ]),
      index: currentIndex,
      decoder: {
        responseType,
        methodName
      }
    };
  }
}

interface IDecoder {
  responseType: protobuf.Type;
  methodName: string;
}

interface IRPCTransaction {
  decoder: IDecoder;
  promiseResolution(message: IMessage): void;
}

class MajsoulConnection {
  public readonly dataSubject = new Subject<Buffer>();

  private socket: WebSocket;

  constructor(
    private readonly server
  ) {
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
      this.dataSubject.next(data as Buffer);
    });

    return new Promise((resolve, reject) => {
      this.socket.on("open", () => resolve());
      this.socket.on("error", (e) => reject(e));
    });
  }

  public close () {
    this.socket.terminate();
  }

  public send(data: Buffer): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Connection is not opened");
    }
    this.socket.send(data);
  }
}

class MajsoulRPC {
  private transactionMap: {[key: string]: IRPCTransaction} = {};

  constructor(
    private readonly connection: MajsoulConnection,
    private readonly codec: MajsoulProtoCodec,
    private readonly timeout = 10000
  ){
    this.connection.dataSubject.subscribe((data) => {
      const index = this.codec.getIndex(data);
      const transaction = this.transactionMap[index];
      if (!transaction) {
        console.log("missing transation promise");
        return;
      }
      delete this.transactionMap[index];
      transaction.promiseResolution(this.codec.decodeMessage(data, transaction.decoder));
    });
  }

  public rpcCall(methodName, payload): Promise<any> {
    const req = this.codec.encodeRequest({ methodName, payload });
    return new Promise<IMessage>((resolve, reject) => {
      this.transactionMap[req.index] = {
        decoder: req.decoder,
        promiseResolution: resolve
      }
      this.connection.send(req.buffer);
      setTimeout(() => {
        delete this.transactionMap[req.index];
        reject("timed out");
      }, this.timeout);
    });
  }

  public dispose(): void {
    this.connection.close();
  }
}

export class MajsoulAPI {
  private rpc: MajsoulRPC;
  codec: MajsoulProtoCodec;

  public async init(): Promise<void> {
    const URL_BASE = majsoul.urlBase || "https://mahjongsoul.game.yo-star.com/";
    const versionInfo = await getRes<IVersion>(URL_BASE + "version.json?randv=" + Math.random().toString().slice(2));
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

    this.codec = new MajsoulProtoCodec(pbDef, pbVersion);
    // console.log(codec.decodeMessage(Buffer.from("", "hex")));
    const serverIndex = Math.floor(Math.random() * serverList.servers.length);
    const connection = new MajsoulConnection(
      `wss://${serverList.servers[serverIndex]}`
    );
    this.rpc = new MajsoulRPC(connection, this.codec);
    await connection.init();

    const type = 8;
    let resp = await this.rpc.rpcCall(".lq.Lobby.oauth2Auth", {
      type: 8,
      code: passport.accessToken,
      uid: passport.uid,
    });
    const accessToken = resp.payload.access_token;

    resp = await this.rpc.rpcCall(".lq.Lobby.oauth2Check", {type, access_token: accessToken});
    console.log(resp);
    if (!resp.payload.has_account) {
      await new Promise((res) => setTimeout(res, 2000));
      resp = await this.rpc.rpcCall(".lq.Lobby.oauth2Check", {type, access_token: accessToken});
    }
    assert(resp.payload.has_account);
    resp = await this.rpc.rpcCall(".lq.Lobby.oauth2Login", {
      type,
      access_token: accessToken,
      reconnect: false,
      device: { device_type: "pc", browser: "safari" },
      random_key: uuidv4(),
      client_version: versionInfo.version,
    });
    assert(resp.payload.account_id);
    console.log("Connection ready");
  };

  public async getContest (contestId): Promise<IContest> {
    let resp = await this.rpc.rpcCall(".lq.Lobby.fetchCustomizedContestByContestId", {
      contest_id: contestId,
    });
    const realId = resp.payload.contest_info.unique_id;
    let nextIndex = undefined;
    const idLog = {};

    while (true) {
      resp = await this.rpc.rpcCall(".lq.Lobby.fetchCustomizedContestGameRecords", {
        unique_id: realId,
        last_index: nextIndex,
      });
      for (const game of resp.payload.record_list) {
        idLog[game.uuid] = true;
      }

      if (!resp.payload.next_index || !resp.payload.record_list.length) {
        break;
      }
      nextIndex = resp.payload.next_index;
    }

    return {
      games: Object.keys(idLog).map(id => { return  {id} }).reverse()
    }
  }

  private getAgariRecord(hule: any): IAgariInfo {
    return {
      value: hule.point_zimo_qin + hule.point_zimo_xian * 2,
      winner: hule.seat,
      han: (hule.fans as any[]).map(f => Array(f.val).fill(f.id)).flat()
    };
  }

  public async getGame(id: string): Promise<GameResult> {
    console.log(id);
    const resp = (await this.rpc.rpcCall(".lq.Lobby.fetchGameRecord", { game_uuid: id })).payload;
    const records = this.codec.decode(resp.data).records.map((r) => this.codec.decode(r));
    const hands: IHandRecord[] = [];

    let lastDiscardSeat: number;
    let hand: IHandRecord;
    for (const record of records) {
      switch (record.constructor.name) {
        case "RecordNewRound":
          hand = {
            round: record.chang,
            dealership: record.ju,
            repeats: record.ben
          };
          break;
        case "RecordDiscardTile": {
          lastDiscardSeat = record.seat;
          break;
        }
        case "RecordNoTile": {
          if (!hand) {
            console.log("Missing hand for NoTile event");
            continue;
          }

          hand.draw = {
            playerDrawStatus: (record.players as any[]).map((player, index) => {
              if (record.liujumanguan && (record.scores as any[]).find(score => score.seat === index)) {
                return DrawStatus.Nagashi_Mangan;
              }
              return player.tingpai ? DrawStatus.Tenpai :  DrawStatus.Noten;
            })
          };

          hands.push(hand);
          hand = null;
          break;
        }
        case "RecordHule": {
          if (!hand) {
            console.log("Missing hand for Hule event");
            continue;
          }

          if (record.hules[0].zimo) {
            const hule = record.hules[0];
            hand.tsumo = {
              ...this.getAgariRecord(hule),
              dealerValue: hule.point_zimo_qin,
            }
            hands.push(hand);
            hand = null;
            break;
          }

          hand.rons = (record.hules as any[]).map(hule => {
            return {
              ...this.getAgariRecord(hule),
              loser: lastDiscardSeat
            }
          });
          lastDiscardSeat = null;
          hands.push(hand);
          hand = null;
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
      hands: hands
    };
    //const recordData = resp.data_url ? await withRetry(() => rp({uri: resp.data_url, encoding: null, timeout: 5000})) : resp.data;
    //console.log(conn._codec.decodeMessage(recordData));
    //await new Promise(r => setTimeout(r, 1000));
  }

  public dispose() {
    this.rpc.dispose();
  }
}

interface IContest {
  games: {
    id: string
  }[];
}