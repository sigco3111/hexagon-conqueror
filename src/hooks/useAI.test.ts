import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAI } from './useAI';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { Difficulty, GamePhase, Owner, type BattleResult } from '@/types/game';
import { resolveBattle } from '@/utils/battleCalc';
import { createMockCell } from '@/test/testUtils';

vi.mock('@/utils/battleCalc', () => ({
  resolveBattle: vi.fn(),
}));

function setupAIGrid(): void {
  const cells = [];
  for (let i = 0; i < 10; i++) {
    cells.push(
      createMockCell({
        id: `cell-${i}`,
        neighbors: [...(i > 0 ? [`cell-${i - 1}`] : []), ...(i < 9 ? [`cell-${i + 1}`] : [])],
        owner: i === 0 ? Owner.AI : i === 9 ? Owner.PLAYER : Owner.NEUTRAL,
      }),
    );
  }
  useMapStore.getState().loadCells(cells);
  useGameStore.getState().initGame(Difficulty.NORMAL);
  useGameStore.getState().setPhase(GamePhase.AI_TURN);
}

beforeEach(() => {
  useGameStore.getState().resetGame();
  useMapStore.getState().loadCells([]);
  useBattleStore.getState().clearLog();
  vi.restoreAllMocks();
});

describe('useAI', () => {
  describe('executeAITurn', () => {
    it('executes AI moves and ends turn', async () => {
      setupAIGrid();
      const mockResult: BattleResult = {
        attackerCellId: 'cell-0',
        defenderCellId: 'cell-1',
        attackPower: 10,
        defensePower: 5,
        diceRoll: 3,
        success: true,
        timestamp: Date.now(),
        attackerOwner: Owner.AI,
      };
      vi.mocked(resolveBattle).mockReturnValue(mockResult);

      const { result } = renderHook(() => useAI());

      vi.useFakeTimers();
      await act(async () => {
        const promise = result.current.executeAITurn();
        await vi.runAllTimersAsync();
        await promise;
      });
      vi.useRealTimers();

      expect(useBattleStore.getState().battleLog.length).toBeGreaterThan(0);
      expect(useGameStore.getState().phase).toBe(GamePhase.PLAYER_TURN);
      expect(useMapStore.getState().cells['cell-1']!.owner).toBe(Owner.AI);
    });

    it('ends turn without moves when no attackable neighbors', async () => {
      const cells: ReturnType<typeof createMockCell>[] = [
        createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1'] }),
        createMockCell({ id: 'cell-1', owner: Owner.AI, neighbors: ['cell-0'] }),
        createMockCell({ id: 'cell-2', owner: Owner.PLAYER, neighbors: ['cell-3'] }),
        createMockCell({ id: 'cell-3', owner: Owner.NEUTRAL, neighbors: ['cell-2'] }),
      ];
      useMapStore.getState().loadCells(cells);
      useGameStore.getState().initGame(Difficulty.EASY);
      useGameStore.getState().setPhase(GamePhase.AI_TURN);

      const { result } = renderHook(() => useAI());

      await act(async () => {
        await result.current.executeAITurn();
      });

      expect(useBattleStore.getState().battleLog).toHaveLength(0);
      expect(useGameStore.getState().phase).toBe(GamePhase.PLAYER_TURN);
    });

    it('sets GAME_OVER when AI conquers all player cells', async () => {
      const cells = [
        createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1'] }),
        createMockCell({ id: 'cell-1', owner: Owner.PLAYER, neighbors: ['cell-0'] }),
      ];
      useMapStore.getState().loadCells(cells);
      useGameStore.getState().initGame(Difficulty.NORMAL);
      useGameStore.getState().setPhase(GamePhase.AI_TURN);

      const mockResult: BattleResult = {
        attackerCellId: 'cell-0',
        defenderCellId: 'cell-1',
        attackPower: 10,
        defensePower: 5,
        diceRoll: 3,
        success: true,
        timestamp: Date.now(),
        attackerOwner: Owner.AI,
      };
      vi.mocked(resolveBattle).mockReturnValue(mockResult);

      const { result } = renderHook(() => useAI());

      vi.useFakeTimers();
      await act(async () => {
        const promise = result.current.executeAITurn();
        await vi.runAllTimersAsync();
        await promise;
      });
      vi.useRealTimers();

      expect(useGameStore.getState().winner).toBe(Owner.AI);
      expect(useGameStore.getState().phase).toBe(GamePhase.GAME_OVER);
    });

    it('resets AI consecutive wins on battle failure', async () => {
      setupAIGrid();
      const failResult: BattleResult = {
        attackerCellId: 'cell-0',
        defenderCellId: 'cell-1',
        attackPower: 5,
        defensePower: 10,
        diceRoll: 6,
        success: false,
        timestamp: Date.now(),
        attackerOwner: Owner.AI,
      };
      vi.mocked(resolveBattle).mockReturnValue(failResult);

      const { result } = renderHook(() => useAI());

      vi.useFakeTimers();
      await act(async () => {
        const promise = result.current.executeAITurn();
        await vi.runAllTimersAsync();
        await promise;
      });
      vi.useRealTimers();

      expect(useMapStore.getState().cells['cell-1']!.owner).toBe(Owner.NEUTRAL);
      expect(useBattleStore.getState().battleLog.length).toBeGreaterThan(0);
      expect(useGameStore.getState().phase).toBe(GamePhase.PLAYER_TURN);
    });

    it('calculates action points based on AI cell count', async () => {
      const cells = [];
      for (let i = 0; i < 15; i++) {
        cells.push(
          createMockCell({
            id: `cell-${i}`,
            neighbors: [...(i > 0 ? [`cell-${i - 1}`] : []), ...(i < 14 ? [`cell-${i + 1}`] : [])],
            owner: i < 11 ? Owner.AI : i === 14 ? Owner.PLAYER : Owner.NEUTRAL,
          }),
        );
      }
      useMapStore.getState().loadCells(cells);
      useGameStore.getState().initGame(Difficulty.NORMAL);
      useGameStore.getState().setPhase(GamePhase.AI_TURN);

      const successResult: BattleResult = {
        attackerCellId: '',
        defenderCellId: '',
        attackPower: 10,
        defensePower: 5,
        diceRoll: 3,
        success: true,
        timestamp: Date.now(),
        attackerOwner: Owner.AI,
      };
      vi.mocked(resolveBattle).mockReturnValue(successResult);

      const { result } = renderHook(() => useAI());

      vi.useFakeTimers();
      await act(async () => {
        const promise = result.current.executeAITurn();
        await vi.runAllTimersAsync();
        await promise;
      });
      vi.useRealTimers();

      // 11 AI cells → baseAP 3 + floor(11/10)*1 = 4 action points
      // Should make 4 attacks (all succeed)
      expect(useBattleStore.getState().battleLog.length).toBe(4);
    });
  });
});
