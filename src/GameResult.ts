import { FinalScore } from './PlayerGameResults';
import { IHandRecord } from './IHandRecord';
export interface PlayerInfo {
  name: string;
}

export interface GameResult {
  id: string;
  time: number;
  players: PlayerInfo[];
  finalScore: FinalScore[];
  hands: IHandRecord[];
}
