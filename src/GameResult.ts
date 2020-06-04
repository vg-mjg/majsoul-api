import { PlayerGameResults } from './PlayerGameResults';
import { IHandRecord } from './IHandRecord';
export interface GameResult {
  id: string;
  time: number;
  playerResults: PlayerGameResults[];
  hands: IHandRecord[];
}
