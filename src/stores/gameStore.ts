import { create } from 'zustand';
import { Owner, Difficulty, GamePhase, type GameState, type BattleResult } from '@/types/game';

interface GameStoreState extends Omit<GameState, 'cells'> {
  lastBattleResult: BattleResult | null;
  autoPlay: boolean;
  hasFortified: boolean;
}

interface GameActions {
  initGame: (difficulty: Difficulty) => void;
  setPhase: (phase: GamePhase) => void;
  selectCell: (id: string | null) => void;
  targetCell: (id: string | null) => void;
  consumeActionPoint: () => void;
  addConsecutiveWin: () => void;
  resetConsecutiveWins: () => void;
  nextTurn: () => void;
  setWinner: (owner: Owner) => void;
  resetGame: () => void;
  setLastBattleResult: (result: BattleResult | null) => void;
  calculateActionPoints: (ownedCellCount: number, baseAP: number, apPerTenCells: number) => number;
  toggleAutoPlay: () => void;
  setHasFortified: (v: boolean) => void;
  setActionPoints: (ap: number) => void;
}

const DEFAULT_MAX_TURNS = 100;
const DEFAULT_BASE_AP = 3;


const initialState: GameStoreState = {
  phase: GamePhase.SETUP,
  turn: 1,
  maxTurns: DEFAULT_MAX_TURNS,
  actionPoints: DEFAULT_BASE_AP,
  selectedCellId: null,
  targetCellId: null,
  consecutiveWins: 0,
  difficulty: Difficulty.NORMAL,
  winner: null,
  lastBattleResult: null,
  autoPlay: false,
  hasFortified: false,
};

export const useGameStore = create<GameStoreState & GameActions>((set) => ({
  ...initialState,

  initGame: (difficulty) => {
    set({
      ...initialState,
      difficulty,
      phase: GamePhase.PLAYER_TURN,
      turn: 1,
      winner: null,
      autoPlay: false,
      hasFortified: false,
    });
  },

  setPhase: (phase) => set({ phase }),

  selectCell: (id) => set({ selectedCellId: id }),

  targetCell: (id) => set({ targetCellId: id }),

  consumeActionPoint: () => set(state => ({ actionPoints: Math.max(0, state.actionPoints - 1) })),

  addConsecutiveWin: () => set(state => ({ consecutiveWins: state.consecutiveWins + 1 })),

  resetConsecutiveWins: () => set({ consecutiveWins: 0 }),

  nextTurn: () => set(state => ({
    turn: state.turn + 1,
    actionPoints: DEFAULT_BASE_AP,
    selectedCellId: null,
    targetCellId: null,
    hasFortified: false,
    phase: state.phase === GamePhase.PLAYER_TURN ? GamePhase.AI_TURN : GamePhase.PLAYER_TURN,
  })),

  setWinner: (owner) => set({ winner: owner, phase: GamePhase.GAME_OVER }),

  resetGame: () => set({ ...initialState }),

  setLastBattleResult: (result) => set({ lastBattleResult: result }),

  calculateActionPoints: (ownedCellCount, baseAP, apPerTenCells) => {
    return baseAP + Math.floor(ownedCellCount / 10) * apPerTenCells;
  },

  toggleAutoPlay: () => set(state => ({ autoPlay: !state.autoPlay })),

  setHasFortified: (v) => set({ hasFortified: v }),

  setActionPoints: (ap) => set({ actionPoints: ap }),
}));
