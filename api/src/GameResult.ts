import { FinalScore } from './PlayerGameResults';
import { IRoundResult } from './IHandRecord';

export interface IContestTeam {
  name: string;
  players: IPlayer[];
}

export interface IPlayer {
  majsoulId: number;
  nickname: string;
  displayName: string;
}

export interface IContest {
  majsoulId: number;
  contestId: number;
  name: string;
  teams: IContestTeam[];
}

export interface GameResult {
  contestId: string;
  majsoulId: string;
  start_time: number;
  end_time: number;
  players: {
    name: string;
    majsoulId: number;
  }[];
  finalScore: FinalScore[];
  rounds: IRoundResult[];
}
