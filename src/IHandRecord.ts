import { Han } from "./Yaku";

interface IHanRecord {
    type: Han;
    ammount: number;
}

export enum DrawStatus {
    Noten,
    Tenpai,
    Nagashi_Mangan,
}

interface IDrawRecord {
    playerDrawStatus: DrawStatus[];
}

export interface IAgariInfo {
    winner: number;
    value: number;
    han: IHanRecord[];
}

interface ITsumoRecord extends IAgariInfo {
    dealerValue: number;
}

interface IRonRecord extends IAgariInfo {
    loser: number;
}

export interface IHandRecord {
    round: number;
    dealership: number;
    repeats: number;

    draw?: IDrawRecord;
    tsumo?: ITsumoRecord;
    rons?: IRonRecord[];
}
