import { PlayerGameResults } from './PlayerGameResults';
export interface GameResult {
  id: string;
  time: number;
  playerResults: PlayerGameResults[];
}
