import { describe, it, expect, afterEach } from 'vitest';
import { useGameStore } from './gameStore';
import { Difficulty, GamePhase, Owner } from '@/types/game';

afterEach(() => {
  useGameStore.getState().resetGame();
});

describe('gameStore', () => {
  it('initGame sets correct initial state', () => {
    useGameStore.getState().initGame(Difficulty.HARD);
    const state = useGameStore.getState();
    expect(state.difficulty).toBe(Difficulty.HARD);
    expect(state.phase).toBe(GamePhase.PLAYER_TURN);
    expect(state.turn).toBe(1);
    expect(state.actionPoints).toBe(3);
    expect(state.selectedCellId).toBeNull();
    expect(state.targetCellId).toBeNull();
    expect(state.consecutiveWins).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.hasFortified).toBe(false);
  });

  it('selectCell and targetCell update state', () => {
    useGameStore.getState().selectCell('cell-1');
    expect(useGameStore.getState().selectedCellId).toBe('cell-1');
    useGameStore.getState().targetCell('cell-2');
    expect(useGameStore.getState().targetCellId).toBe('cell-2');
  });

  it('calculateActionPoints returns correct value', () => {
    const calc = useGameStore.getState().calculateActionPoints;
    expect(calc(0, 3, 1)).toBe(3);
    expect(calc(10, 3, 1)).toBe(4);
    expect(calc(25, 3, 1)).toBe(5);
    expect(calc(99, 3, 1)).toBe(12);
    void Owner;
  });

  it('nextTurn increases turn and resets selection', () => {
    useGameStore.getState().initGame(Difficulty.NORMAL);
    useGameStore.getState().selectCell('cell-1');
    useGameStore.getState().targetCell('cell-2');
    useGameStore.getState().nextTurn();
    const state = useGameStore.getState();
    expect(state.turn).toBe(2);
    expect(state.selectedCellId).toBeNull();
    expect(state.targetCellId).toBeNull();
    expect([GamePhase.PLAYER_TURN, GamePhase.AI_TURN]).toContain(state.phase);
  });

  it('resetGame resets to initial state', () => {
    useGameStore.getState().initGame(Difficulty.EASY);
    useGameStore.getState().selectCell('cell-1');
    useGameStore.getState().resetGame();
    const state = useGameStore.getState();
    expect(state.phase).toBe(GamePhase.SETUP);
    expect(state.selectedCellId).toBeNull();
    expect(state.difficulty).toBe(Difficulty.NORMAL);
    expect(state.hasFortified).toBe(false);
  });
});
