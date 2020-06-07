import { FinalScore } from './PlayerGameResults';
import { IRoundResult } from './IHandRecord';
export interface PlayerInfo {
  name: string;
}

export interface GameResult {
  majsoulId: string;
  time: number;
  players: PlayerInfo[];
  finalScore: FinalScore[];
  rounds: IRoundResult[];
}
