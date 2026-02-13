
export interface GameItem {
  letter: string;
  name: string;
  emoji: string;
  color: string;
}

export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  CELEBRATION = 'CELEBRATION',
}
