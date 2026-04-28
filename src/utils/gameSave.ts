import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { GamePhase, type HexCell, type BattleResult, type Difficulty, type Owner } from '@/types/game';

const SAVE_KEY = 'hexagon-conqueror-save';

function getStorage(): Storage | null {
  try {
    if (
      typeof localStorage !== 'undefined' &&
      typeof localStorage.getItem === 'function' &&
      typeof localStorage.setItem === 'function' &&
      typeof localStorage.removeItem === 'function'
    ) {
      return localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

export interface SaveData {
  gameState: {
    phase: GamePhase;
    turn: number;
    maxTurns: number;
    actionPoints: number;
    selectedCellId: string | null;
    targetCellId: string | null;
    consecutiveWins: number;
    difficulty: Difficulty;
    winner: Owner | null;
    autoPlay: boolean;
    hasFortified: boolean;
  };
  cells: Record<string, HexCell>;
  battleLog: BattleResult[];
  savedAt: number;
}

export function saveGameState(): void {
  const phase = useGameStore.getState().phase;
  if (phase !== GamePhase.PLAYER_TURN && phase !== GamePhase.AI_TURN) return;

  const gs = useGameStore.getState();
  const data: SaveData = {
    gameState: {
      phase: gs.phase,
      turn: gs.turn,
      maxTurns: gs.maxTurns,
      actionPoints: gs.actionPoints,
      selectedCellId: gs.selectedCellId,
      targetCellId: gs.targetCellId,
      consecutiveWins: gs.consecutiveWins,
      difficulty: gs.difficulty,
      winner: gs.winner,
      autoPlay: gs.autoPlay,
      hasFortified: gs.hasFortified,
    },
    cells: useMapStore.getState().cells,
    battleLog: useBattleStore.getState().battleLog,
    savedAt: Date.now(),
  };

  try {
    getStorage()?.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadGameState(): SaveData | null {
  try {
    const raw = getStorage()?.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function clearSaveState(): void {
  getStorage()?.removeItem(SAVE_KEY);
}

export function hasSavedGame(): boolean {
  return getStorage()?.getItem(SAVE_KEY) !== null;
}

export function restoreGameState(data: SaveData): void {
  const { gameState, cells, battleLog } = data;

  useGameStore.setState({
    phase: gameState.phase,
    turn: gameState.turn,
    maxTurns: gameState.maxTurns,
    actionPoints: gameState.actionPoints,
    selectedCellId: gameState.selectedCellId,
    targetCellId: gameState.targetCellId,
    consecutiveWins: gameState.consecutiveWins,
    difficulty: gameState.difficulty,
    winner: gameState.winner,
    autoPlay: gameState.autoPlay,
    hasFortified: gameState.hasFortified,
  });

  useMapStore.getState().loadCells(Object.values(cells));
  useBattleStore.setState({ battleLog });
}
