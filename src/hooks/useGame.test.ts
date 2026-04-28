import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { Difficulty, GamePhase, Owner, type BattleResult } from '@/types/game';
import { resolveBattle } from '@/utils/battleCalc';
import { createMockCell } from '@/test/testUtils';

vi.mock('@/data/koreaHexGrid.json', () => {
  const cells: Array<Record<string, unknown>> = [];
  for (let i = 0; i < 20; i++) {
    cells.push({
      id: `cell-${i}`,
      center: [37 + i * 0.01, 126 + i * 0.01],
      boundary: [],
      neighbors: [...(i > 0 ? [`cell-${i - 1}`] : []), ...(i < 19 ? [`cell-${i + 1}`] : [])],
      owner: 'NEUTRAL',
      defense: 5,
      population: 50,
      resources: 25,
      region: '',
    });
  }
  return { default: cells };
});

vi.mock('@/utils/battleCalc', () => ({
  resolveBattle: vi.fn(),
}));

function setupLoadedGrid(): void {
  const cells = [];
  for (let i = 0; i < 20; i++) {
    cells.push(
      createMockCell({
        id: `cell-${i}`,
        neighbors: [...(i > 0 ? [`cell-${i - 1}`] : []), ...(i < 19 ? [`cell-${i + 1}`] : [])],
        owner: i === 0 ? Owner.PLAYER : i === 19 ? Owner.AI : Owner.NEUTRAL,
      }),
    );
  }
  useMapStore.getState().loadCells(cells);
  useGameStore.getState().initGame(Difficulty.NORMAL);
}

beforeEach(() => {
  useGameStore.getState().resetGame();
  useMapStore.getState().loadCells([]);
  useBattleStore.getState().clearLog();
  vi.restoreAllMocks();
});

describe('useGame', () => {
  describe('initNewGame', () => {
    it('creates correct initial state with player and AI each having 1 cell', () => {
      const { result } = renderHook(() => useGame());
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

      act(() => {
        result.current.initNewGame(Difficulty.EASY);
      });

      const gameState = useGameStore.getState();
      expect(gameState.phase).toBe(GamePhase.PLAYER_TURN);
      expect(gameState.difficulty).toBe(Difficulty.EASY);
      expect(gameState.selectedCellId).toBeNull();
      expect(gameState.targetCellId).toBeNull();
      expect(gameState.consecutiveWins).toBe(0);
      expect(gameState.winner).toBeNull();

      const mapState = useMapStore.getState();
      expect(mapState.getPlayerCells()).toHaveLength(1);
      expect(mapState.getAICells()).toHaveLength(1);
      expect(mapState.getNeutralCells()).toHaveLength(18);
      expect(mapState.getPlayerCells()[0]!.id).toBe('cell-0');
      expect(mapState.getAICells()[0]!.id).toBe('cell-10');

      randomSpy.mockRestore();
    });

    it('places AI at least 10 cells away from player', () => {
      const { result } = renderHook(() => useGame());
      vi.spyOn(Math, 'random').mockReturnValue(0);

      act(() => {
        result.current.initNewGame(Difficulty.NORMAL);
      });

      const mapState = useMapStore.getState();
      const playerId = mapState.getPlayerCells()[0]!.id;
      const aiId = mapState.getAICells()[0]!.id;
      const playerIdx = parseInt(playerId.split('-')[1]!, 10);
      const aiIdx = parseInt(aiId.split('-')[1]!, 10);
      expect(Math.abs(aiIdx - playerIdx)).toBeGreaterThanOrEqual(10);
    });

    it('clears battle log on new game', () => {
      useBattleStore.getState().addBattleResult({
        attackerCellId: 'a',
        defenderCellId: 'b',
        attackPower: 10,
        defensePower: 5,
        diceRoll: 3,
        success: true,
        timestamp: Date.now(),
        attackerOwner: Owner.PLAYER,
      });
      expect(useBattleStore.getState().battleLog).toHaveLength(1);

      const { result } = renderHook(() => useGame());
      vi.spyOn(Math, 'random').mockReturnValue(0);

      act(() => {
        result.current.initNewGame(Difficulty.NORMAL);
      });

      expect(useBattleStore.getState().battleLog).toHaveLength(0);
    });
  });

  describe('handleCellClick', () => {
    it('selects a player-owned cell', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleCellClick('cell-0');
      });

      expect(useGameStore.getState().selectedCellId).toBe('cell-0');
      expect(useGameStore.getState().targetCellId).toBeNull();
    });

    it('deselects when clicking the same cell', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleCellClick('cell-0');
      });
      expect(useGameStore.getState().selectedCellId).toBe('cell-0');

      act(() => {
        result.current.handleCellClick('cell-0');
      });
      expect(useGameStore.getState().selectedCellId).toBeNull();
      expect(useGameStore.getState().targetCellId).toBeNull();
    });

    it('sets target when clicking adjacent non-player cell with existing selection', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleCellClick('cell-0');
      });
      act(() => {
        result.current.handleCellClick('cell-1');
      });

      expect(useGameStore.getState().targetCellId).toBe('cell-1');
    });

    it('does nothing when not in PLAYER_TURN phase', () => {
      setupLoadedGrid();
      useGameStore.getState().setPhase(GamePhase.AI_TURN);
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleCellClick('cell-0');
      });

      expect(useGameStore.getState().selectedCellId).toBeNull();
    });

    it('does not set target for non-adjacent cell', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleCellClick('cell-0');
      });
      act(() => {
        result.current.handleCellClick('cell-5');
      });

      expect(useGameStore.getState().targetCellId).toBeNull();
    });
  });

  describe('executeAttack', () => {
    it('succeeds and transfers ownership to player', () => {
      setupLoadedGrid();
      const mockResult: BattleResult = {
        attackerCellId: 'cell-0',
        defenderCellId: 'cell-1',
        attackPower: 10,
        defensePower: 5,
        diceRoll: 3,
        success: true,
        timestamp: Date.now(),
        attackerOwner: Owner.PLAYER,
      };
      vi.mocked(resolveBattle).mockReturnValue(mockResult);

      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');
      useGameStore.getState().targetCell('cell-1');

      act(() => {
        result.current.executeAttack();
      });

      expect(useMapStore.getState().cells['cell-1']!.owner).toBe(Owner.PLAYER);
      expect(useGameStore.getState().consecutiveWins).toBe(1);
      expect(useGameStore.getState().actionPoints).toBe(2);
      expect(useGameStore.getState().selectedCellId).toBeNull();
      expect(useGameStore.getState().targetCellId).toBeNull();
      expect(useBattleStore.getState().battleLog).toHaveLength(1);
    });

    it('fails and resets consecutive wins', () => {
      setupLoadedGrid();
      const mockResult: BattleResult = {
        attackerCellId: 'cell-0',
        defenderCellId: 'cell-1',
        attackPower: 5,
        defensePower: 10,
        diceRoll: 6,
        success: false,
        timestamp: Date.now(),
        attackerOwner: Owner.PLAYER,
      };
      vi.mocked(resolveBattle).mockReturnValue(mockResult);

      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');
      useGameStore.getState().targetCell('cell-1');
      useGameStore.getState().addConsecutiveWin();

      act(() => {
        result.current.executeAttack();
      });

      expect(useMapStore.getState().cells['cell-1']!.owner).toBe(Owner.NEUTRAL);
      expect(useGameStore.getState().consecutiveWins).toBe(0);
      expect(useGameStore.getState().actionPoints).toBe(2);
    });

    it('does nothing without selection and target', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.executeAttack();
      });

      expect(useGameStore.getState().actionPoints).toBe(3);
    });

    it('does nothing when action points are zero', () => {
      setupLoadedGrid();
      useGameStore.getState().consumeActionPoint();
      useGameStore.getState().consumeActionPoint();
      useGameStore.getState().consumeActionPoint();
      useGameStore.getState().selectCell('cell-0');
      useGameStore.getState().targetCell('cell-1');

      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.executeAttack();
      });

      expect(useMapStore.getState().cells['cell-1']!.owner).toBe(Owner.NEUTRAL);
      expect(useBattleStore.getState().battleLog).toHaveLength(0);
    });

    it('triggers win condition when all cells become player-owned', () => {
      setupLoadedGrid();
      for (let i = 2; i < 20; i++) {
        useMapStore.getState().updateCellOwner(`cell-${i}`, Owner.PLAYER);
      }

      const mockResult: BattleResult = {
        attackerCellId: 'cell-0',
        defenderCellId: 'cell-1',
        attackPower: 10,
        defensePower: 5,
        diceRoll: 3,
        success: true,
        timestamp: Date.now(),
        attackerOwner: Owner.PLAYER,
      };
      vi.mocked(resolveBattle).mockReturnValue(mockResult);

      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');
      useGameStore.getState().targetCell('cell-1');

      act(() => {
        result.current.executeAttack();
      });

      expect(useGameStore.getState().winner).toBe(Owner.PLAYER);
      expect(useGameStore.getState().phase).toBe(GamePhase.GAME_OVER);
    });
  });

  describe('endPlayerTurn', () => {
    it('switches phase to AI_TURN and clears selections', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');
      useGameStore.getState().targetCell('cell-1');

      act(() => {
        result.current.endPlayerTurn();
      });

      expect(useGameStore.getState().phase).toBe(GamePhase.AI_TURN);
      expect(useGameStore.getState().selectedCellId).toBeNull();
      expect(useGameStore.getState().targetCellId).toBeNull();
    });
  });

  describe('fortifyCell', () => {
    it('increases defense and decreases resources', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');

      act(() => {
        result.current.fortifyCell();
      });

      expect(useMapStore.getState().cells['cell-0']!.defense).toBe(6);
      expect(useMapStore.getState().cells['cell-0']!.resources).toBe(5);
      expect(useGameStore.getState().actionPoints).toBe(2);
      expect(useGameStore.getState().hasFortified).toBe(true);
    });

    it('fails when hasFortified is true', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');
      useGameStore.getState().setHasFortified(true);

      act(() => {
        result.current.fortifyCell();
      });

      expect(useMapStore.getState().cells['cell-0']!.defense).toBe(5);
      expect(useMapStore.getState().cells['cell-0']!.resources).toBe(25);
      expect(useGameStore.getState().actionPoints).toBe(3);
    });

    it('fails when cell resources < 20', () => {
      setupLoadedGrid();
      useMapStore.getState().updateCell('cell-0', { resources: 19 });
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');

      act(() => {
        result.current.fortifyCell();
      });

      expect(useMapStore.getState().cells['cell-0']!.defense).toBe(5);
      expect(useMapStore.getState().cells['cell-0']!.resources).toBe(19);
      expect(useGameStore.getState().actionPoints).toBe(3);
      expect(useGameStore.getState().hasFortified).toBe(false);
    });

    it('fails without a selected cell', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.fortifyCell();
      });

      expect(useGameStore.getState().actionPoints).toBe(3);
      expect(useGameStore.getState().hasFortified).toBe(false);
    });

    it('fails when action points are zero', () => {
      setupLoadedGrid();
      useGameStore.getState().setActionPoints(0);
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');

      act(() => {
        result.current.fortifyCell();
      });

      expect(useMapStore.getState().cells['cell-0']!.defense).toBe(5);
      expect(useGameStore.getState().hasFortified).toBe(false);
    });

    it('fails when selected cell is not player-owned', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-1');

      act(() => {
        result.current.fortifyCell();
      });

      expect(useMapStore.getState().cells['cell-1']!.defense).toBe(5);
      expect(useGameStore.getState().hasFortified).toBe(false);
    });

    it('fails when not in PLAYER_TURN phase', () => {
      setupLoadedGrid();
      useGameStore.getState().setPhase(GamePhase.AI_TURN);
      const { result } = renderHook(() => useGame());
      useGameStore.getState().selectCell('cell-0');

      act(() => {
        result.current.fortifyCell();
      });

      expect(useMapStore.getState().cells['cell-0']!.defense).toBe(5);
      expect(useGameStore.getState().hasFortified).toBe(false);
    });
  });

  describe('isAdjacent', () => {
    it('returns true for adjacent cells', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      expect(result.current.isAdjacent('cell-0', 'cell-1')).toBe(true);
      expect(result.current.isAdjacent('cell-1', 'cell-0')).toBe(true);
    });

    it('returns false for non-adjacent cells', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      expect(result.current.isAdjacent('cell-0', 'cell-5')).toBe(false);
    });

    it('returns false for non-existent cells', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      expect(result.current.isAdjacent('nonexistent', 'cell-0')).toBe(false);
    });
  });

  describe('getValidTargets', () => {
    it('returns adjacent non-player cells', () => {
      setupLoadedGrid();
      useGameStore.getState().selectCell('cell-0');

      const { result } = renderHook(() => useGame());
      const targets = result.current.getValidTargets();

      expect(targets).toHaveLength(1);
      expect(targets[0]!.id).toBe('cell-1');
    });

    it('returns empty array without selection', () => {
      setupLoadedGrid();
      const { result } = renderHook(() => useGame());

      expect(result.current.getValidTargets()).toHaveLength(0);
    });

    it('excludes player-owned adjacent cells', () => {
      setupLoadedGrid();
      useMapStore.getState().updateCellOwner('cell-1', Owner.PLAYER);
      useGameStore.getState().selectCell('cell-0');

      const { result } = renderHook(() => useGame());
      expect(result.current.getValidTargets()).toHaveLength(0);
    });
  });
});
