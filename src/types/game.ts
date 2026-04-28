export enum Owner {
  NEUTRAL = 'NEUTRAL',
  PLAYER = 'PLAYER',
  AI = 'AI',
}

export enum Difficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
}

export enum GamePhase {
  SETUP = 'SETUP',
  PLAYER_TURN = 'PLAYER_TURN',
  AI_TURN = 'AI_TURN',
  BATTLE_RESOLUTION = 'BATTLE_RESOLUTION',
  GAME_OVER = 'GAME_OVER',
}

export interface HexCell {
  id: string;
  center: [number, number];
  boundary: [number, number][];
  neighbors: string[];
  owner: Owner;
  defense: number;
  population: number;
  resources: number;
  region: string;
}

export interface GameState {
  cells: Record<string, HexCell>;
  phase: GamePhase;
  turn: number;
  maxTurns: number;
  actionPoints: number;
  selectedCellId: string | null;
  targetCellId: string | null;
  consecutiveWins: number;
  difficulty: Difficulty;
  winner: Owner | null;
}

export interface BattleResult {
  attackerCellId: string;
  defenderCellId: string;
  attackPower: number;
  defensePower: number;
  diceRoll: number;
  success: boolean;
  timestamp: number;
  attackerOwner: Owner;
}

export interface AIMove {
  fromCellId: string;
  toCellId: string;
  estimatedWinChance: number;
}

export interface GameConfig {
  difficulty: Difficulty;
  h3Resolution: number;
  maxTurns: number;
  baseActionPoints: number;
  actionPointsPerTenCells: number;
}
