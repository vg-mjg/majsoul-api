import { FinalScore } from './PlayerGameResults';
import { IRoundResult } from './IHandRecord';
import { ObjectID } from 'mongodb';

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
