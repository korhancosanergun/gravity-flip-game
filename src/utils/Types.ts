export type GravityDirection = 'down' | 'up' | 'left' | 'right';

// 0=empty, 1=solid, 2=start, 3=goal, 4=spike
export type TileType = 0 | 1 | 2 | 3 | 4;

export interface LevelData {
  id: number;
  name: string;
  grid: TileType[][];
  par: number;
}

export type GameStatus = 'playing' | 'dead' | 'won' | 'allComplete';
