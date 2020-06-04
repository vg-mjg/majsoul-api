import { Han } from "./Han";

export enum Wind {
  East = 0,
  South,
  West,
  North,
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
  han: Han[];
}

interface ITsumoRecord extends IAgariInfo {
  dealerValue: number;
}

interface IRonRecord extends IAgariInfo {
  loser: number;
}

export interface IRoundInfo {
  round: Wind;
  dealership: Wind;
  repeat: number;
}

export interface IRoundResult {
  round: IRoundInfo;
  draw?: IDrawRecord;
  tsumo?: ITsumoRecord;
  rons?: IRonRecord[];
}
