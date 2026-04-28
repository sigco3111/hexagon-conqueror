import { describe, it, expect, afterEach } from 'vitest';
import { useBattleStore } from './battleStore';
import { Owner } from '@/types/game';
import type { BattleResult } from '@/types/game';

const mockBattle = (overrides: Partial<BattleResult> = {}): BattleResult => ({
  attackerCellId: 'a',
  defenderCellId: 'd',
  attackPower: 10,
  defensePower: 8,
  diceRoll: 4,
  success: true,
  timestamp: Date.now(),
  attackerOwner: Owner.PLAYER,
  ...overrides,
});

afterEach(() => {
  useBattleStore.getState().clearLog();
});

describe('battleStore', () => {
  it('addBattleResult adds to log', () => {
    useBattleStore.getState().addBattleResult(mockBattle({ attackerCellId: 'x' }));
    expect(useBattleStore.getState().battleLog[0]?.attackerCellId).toBe('x');
  });

  it('getRecentBattles returns recent N (default 10)', () => {
    for (let i = 0; i < 15; i++) {
      useBattleStore.getState().addBattleResult(mockBattle({ attackerCellId: `id${i}` }));
    }
    const recent = useBattleStore.getState().getRecentBattles();
    expect(recent).toHaveLength(10);
    expect(recent[0]?.attackerCellId).toBe('id14');
    expect(recent[9]?.attackerCellId).toBe('id5');
    const last3 = useBattleStore.getState().getRecentBattles(3);
    expect(last3.map(b => b.attackerCellId)).toEqual(['id14', 'id13', 'id12']);
  });

  it('clearLog empties the log', () => {
    useBattleStore.getState().addBattleResult(mockBattle());
    useBattleStore.getState().clearLog();
    expect(useBattleStore.getState().battleLog).toHaveLength(0);
  });
});
