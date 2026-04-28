import { describe, it, expect } from 'vitest';
import {
  easyAIStrategy,
  normalAIStrategy,
  hardAIStrategy,
  getAIStrategy,
  getAIAttackableNeighbors,
  type AIState,
} from './aiStrategy';
import { createMockCell } from '@/test/testUtils';
import { Owner, Difficulty, type HexCell } from '@/types/game';

function createTestGrid(): Record<string, HexCell> {
  return {
    'cell-0': createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1', 'cell-2'] }),
    'cell-1': createMockCell({ id: 'cell-1', owner: Owner.NEUTRAL, neighbors: ['cell-0', 'cell-3'], defense: 3, population: 20 }),
    'cell-2': createMockCell({ id: 'cell-2', owner: Owner.PLAYER, neighbors: ['cell-0', 'cell-3'], defense: 8, population: 80 }),
    'cell-3': createMockCell({ id: 'cell-3', owner: Owner.NEUTRAL, neighbors: ['cell-1', 'cell-2'], defense: 5, population: 50 }),
  };
}

function createAIState(cells: Record<string, HexCell>, overrides: Partial<AIState> = {}): AIState {
  return {
    cells,
    actionPoints: 3,
    consecutiveWins: 0,
    ...overrides,
  };
}

describe('aiStrategy', () => {
  describe('getAIAttackableNeighbors', () => {
    it('returns moves from AI cells to non-AI neighbors', () => {
      const cells = createTestGrid();
      const moves = getAIAttackableNeighbors(cells);

      expect(moves.length).toBe(2);
      expect(moves.every(m => m.fromCellId === 'cell-0')).toBe(true);
      const targetIds = moves.map(m => m.toCellId);
      expect(targetIds).toContain('cell-1');
      expect(targetIds).toContain('cell-2');
    });

    it('does not include AI-owned cells as targets', () => {
      const cells = createTestGrid();
      const moves = getAIAttackableNeighbors(cells);

      const targetIds = moves.map(m => m.toCellId);
      expect(targetIds).not.toContain('cell-0');
    });

    it('returns empty array when AI has no cells', () => {
      const cells: Record<string, HexCell> = {
        'cell-0': createMockCell({ id: 'cell-0', owner: Owner.PLAYER, neighbors: [] }),
      };
      const moves = getAIAttackableNeighbors(cells);
      expect(moves).toHaveLength(0);
    });

    it('returns empty array when all neighbors are AI-owned', () => {
      const cells: Record<string, HexCell> = {
        'cell-0': createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1'] }),
        'cell-1': createMockCell({ id: 'cell-1', owner: Owner.AI, neighbors: ['cell-0'] }),
      };
      const moves = getAIAttackableNeighbors(cells);
      expect(moves).toHaveLength(0);
    });
  });

  describe('easyAIStrategy', () => {
    it('returns a valid move from AI cell to non-AI neighbor', () => {
      const state = createAIState(createTestGrid());
      const move = easyAIStrategy(state);

      expect(move).not.toBeNull();
      expect(move!.fromCellId).toBe('cell-0');
      expect(['cell-1', 'cell-2']).toContain(move!.toCellId);
    });

    it('does not target AI-owned cells', () => {
      const state = createAIState(createTestGrid());
      const move = easyAIStrategy(state);

      expect(move).not.toBeNull();
      const targetCell = state.cells[move!.toCellId];
      expect(targetCell).toBeDefined();
      expect(targetCell!.owner).not.toBe(Owner.AI);
    });

    it('returns null when no moves available', () => {
      const cells: Record<string, HexCell> = {
        'cell-0': createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1'] }),
        'cell-1': createMockCell({ id: 'cell-1', owner: Owner.AI, neighbors: ['cell-0'] }),
      };
      const state = createAIState(cells);
      expect(easyAIStrategy(state)).toBeNull();
    });

    it('sets estimatedWinChance between 0 and 1', () => {
      const state = createAIState(createTestGrid());
      const move = easyAIStrategy(state);

      expect(move).not.toBeNull();
      expect(move!.estimatedWinChance).toBeGreaterThanOrEqual(0);
      expect(move!.estimatedWinChance).toBeLessThanOrEqual(1);
    });
  });

  describe('normalAIStrategy', () => {
    it('selects the target with lowest defense + population', () => {
      const state = createAIState(createTestGrid());
      const move = normalAIStrategy(state);

      expect(move).not.toBeNull();
      expect(move!.toCellId).toBe('cell-1');
    });

    it('does not target AI-owned cells', () => {
      const state = createAIState(createTestGrid());
      const move = normalAIStrategy(state);

      expect(move).not.toBeNull();
      const targetCell = state.cells[move!.toCellId];
      expect(targetCell!.owner).not.toBe(Owner.AI);
    });

    it('returns null when no moves available', () => {
      const cells: Record<string, HexCell> = {
        'cell-0': createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1'] }),
        'cell-1': createMockCell({ id: 'cell-1', owner: Owner.AI, neighbors: ['cell-0'] }),
      };
      const state = createAIState(cells);
      expect(normalAIStrategy(state)).toBeNull();
    });

    it('selects from AI cells only', () => {
      const state = createAIState(createTestGrid());
      const move = normalAIStrategy(state);

      expect(move).not.toBeNull();
      const fromCell = state.cells[move!.fromCellId];
      expect(fromCell!.owner).toBe(Owner.AI);
    });
  });

  describe('hardAIStrategy', () => {
    it('returns a valid move using minimax evaluation', () => {
      const state = createAIState(createTestGrid());
      const move = hardAIStrategy(state);

      expect(move).not.toBeNull();
      expect(move!.fromCellId).toBe('cell-0');
      expect(['cell-1', 'cell-2']).toContain(move!.toCellId);
    });

    it('does not target AI-owned cells', () => {
      const state = createAIState(createTestGrid());
      const move = hardAIStrategy(state);

      expect(move).not.toBeNull();
      const targetCell = state.cells[move!.toCellId];
      expect(targetCell!.owner).not.toBe(Owner.AI);
    });

    it('returns null when no moves available', () => {
      const cells: Record<string, HexCell> = {
        'cell-0': createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1'] }),
        'cell-1': createMockCell({ id: 'cell-1', owner: Owner.AI, neighbors: ['cell-0'] }),
      };
      const state = createAIState(cells);
      expect(hardAIStrategy(state)).toBeNull();
    });

    it('prefers weaker targets through minimax evaluation', () => {
      const cells: Record<string, HexCell> = {
        'cell-0': createMockCell({ id: 'cell-0', owner: Owner.AI, neighbors: ['cell-1', 'cell-2'] }),
        'cell-1': createMockCell({ id: 'cell-1', owner: Owner.NEUTRAL, neighbors: ['cell-0'], defense: 2, population: 10 }),
        'cell-2': createMockCell({ id: 'cell-2', owner: Owner.NEUTRAL, neighbors: ['cell-0'], defense: 10, population: 100 }),
      };
      const state = createAIState(cells);
      const move = hardAIStrategy(state);

      expect(move).not.toBeNull();
      expect(move!.toCellId).toBe('cell-1');
    });

    it('selects from AI cells only', () => {
      const state = createAIState(createTestGrid());
      const move = hardAIStrategy(state);

      expect(move).not.toBeNull();
      const fromCell = state.cells[move!.fromCellId];
      expect(fromCell!.owner).toBe(Owner.AI);
    });
  });

  describe('getAIStrategy', () => {
    it('returns easyAIStrategy for EASY difficulty', () => {
      const strategy = getAIStrategy(Difficulty.EASY);
      expect(strategy).toBe(easyAIStrategy);
    });

    it('returns normalAIStrategy for NORMAL difficulty', () => {
      const strategy = getAIStrategy(Difficulty.NORMAL);
      expect(strategy).toBe(normalAIStrategy);
    });

    it('returns hardAIStrategy for HARD difficulty', () => {
      const strategy = getAIStrategy(Difficulty.HARD);
      expect(strategy).toBe(hardAIStrategy);
    });

    it('all strategies return valid moves for the same state', () => {
      const state = createAIState(createTestGrid());

      const easyMove = easyAIStrategy(state);
      const normalMove = normalAIStrategy(state);
      const hardMove = hardAIStrategy(state);

      expect(easyMove).not.toBeNull();
      expect(normalMove).not.toBeNull();
      expect(hardMove).not.toBeNull();

      for (const move of [easyMove!, normalMove!, hardMove!]) {
        const fromCell = state.cells[move.fromCellId];
        const toCell = state.cells[move.toCellId];
        expect(fromCell!.owner).toBe(Owner.AI);
        expect(toCell!.owner).not.toBe(Owner.AI);
      }
    });
  });
});
