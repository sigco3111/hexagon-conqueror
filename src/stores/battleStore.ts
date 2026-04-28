import { create } from 'zustand';
import type { BattleResult } from '@/types/game';

interface BattleState {
  battleLog: BattleResult[];
}

interface BattleActions {
  addBattleResult: (result: BattleResult) => void;
  clearLog: () => void;
  getRecentBattles: (count?: number) => BattleResult[];
}

export const useBattleStore = create<BattleState & BattleActions>((set, get) => ({
  battleLog: [],

  addBattleResult: (result) => set(state => ({ battleLog: [...state.battleLog, result] })),

  clearLog: () => set({ battleLog: [] }),

  getRecentBattles: (count) => {
    const log = get().battleLog;
    if (!count) return log.slice(-10).reverse();
    return log.slice(-count).reverse();
  },
}));
