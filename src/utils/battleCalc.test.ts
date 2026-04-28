import { describe, it, expect, vi } from 'vitest';
import {
  rollDice,
  calculateAttackPower,
  calculateDefensePower,
  resolveBattle,
} from './battleCalc';
import { createMockCell } from '@/test/testUtils';
import { Owner } from '@/types/game';

describe('battleCalc', () => {
  describe('rollDice', () => {
    it('returns a number between 1 and 6', () => {
      for (let i = 0; i < 100; i++) {
        const result = rollDice();
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
        expect(Number.isInteger(result)).toBe(true);
      }
    });
  });

  describe('calculateAttackPower', () => {
    it('(3, 50, 0) → (3 + 5) * 1 = 8', () => {
      expect(calculateAttackPower(3, 50, 0, 0)).toBeCloseTo(8, 10);
    });

    it('(3, 50, 2) → (3 + 5) * 1.2 = 9.6', () => {
      expect(calculateAttackPower(3, 50, 2, 0)).toBeCloseTo(9.6, 10);
    });

    it('(1, 100, 5) → (1 + 10) * 1.5 = 16.5', () => {
      expect(calculateAttackPower(1, 100, 5, 0)).toBeCloseTo(16.5, 10);
    });

    it('0 action points still produces valid power', () => {
      expect(calculateAttackPower(0, 50, 0, 0)).toBeCloseTo(5, 10);
    });

    it('0 population still produces valid power', () => {
      expect(calculateAttackPower(3, 0, 0, 0)).toBeCloseTo(3, 10);
    });

    it("(3, 50, 0, 40) → (3 + 5 + 2) * 1 = 10", () => {
      expect(calculateAttackPower(3, 50, 0, 40)).toBeCloseTo(10, 10);
    });
  });

  describe('calculateDefensePower', () => {
    it('(5, 3) → 8', () => {
      expect(calculateDefensePower(5, 3)).toBe(8);
    });

    it('(1, 6) → 7', () => {
      expect(calculateDefensePower(1, 6)).toBe(7);
    });

    it('maximum defense: baseDefense=10, dice=6 → 16', () => {
      expect(calculateDefensePower(10, 6)).toBe(16);
    });

    it('minimum defense: baseDefense=0, dice=1 → 1', () => {
      expect(calculateDefensePower(0, 1)).toBe(1);
    });
  });

  describe('resolveBattle', () => {
    it('returns a BattleResult with all required fields', () => {
      const attacker = createMockCell({
        id: 'attacker-cell',
        owner: Owner.PLAYER,
        population: 50,
      });
      const defender = createMockCell({
        id: 'defender-cell',
        owner: Owner.AI,
        defense: 5,
      });

      const result = resolveBattle(attacker, defender, 3, 0);

      expect(result.attackerCellId).toBe('attacker-cell');
      expect(result.defenderCellId).toBe('defender-cell');
      expect(result.diceRoll).toBeGreaterThanOrEqual(1);
      expect(result.diceRoll).toBeLessThanOrEqual(6);
      expect(result.attackPower).toBeCloseTo(9.25, 10);
      expect(result.defensePower).toBe(5 + result.diceRoll);
      expect(result.success).toBe(result.attackPower > result.defensePower);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.attackerOwner).toBe(Owner.PLAYER);
    });

    it('determines success correctly when attack exceeds defense', () => {
      const attacker = createMockCell({
        id: 'strong-attacker',
        owner: Owner.PLAYER,
        population: 100,
      });
      const defender = createMockCell({
        id: 'weak-defender',
        owner: Owner.AI,
        defense: 1,
      });

      // Mock rollDice to return minimum value (1)
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = resolveBattle(attacker, defender, 10, 5);
      // attackPower = (10 + 10 + 1.25) * 1.5 = 31.875, defensePower = 1 + 1 = 2
      expect(result.attackPower).toBeCloseTo(31.875, 10);
      expect(result.defensePower).toBe(2);
      expect(result.success).toBe(true);
      vi.restoreAllMocks();
    });

    it('determines failure correctly when defense exceeds attack', () => {
      const attacker = createMockCell({
        id: 'weak-attacker',
        owner: Owner.PLAYER,
        population: 10,
      });
      const defender = createMockCell({
        id: 'strong-defender',
        owner: Owner.AI,
        defense: 10,
      });

      // Mock rollDice to return maximum value (6): random() = 5/6 → floor(5/6 * 6) + 1 = 6
      vi.spyOn(Math, 'random').mockReturnValue(5 / 6);
      const result = resolveBattle(attacker, defender, 1, 0);
      // attackPower = (1 + 1 + 1.25) * 1 = 3.25, defensePower = 10 + 6 = 16
      expect(result.attackPower).toBeCloseTo(3.25, 10);
      expect(result.defensePower).toBe(16);
      expect(result.success).toBe(false);
      vi.restoreAllMocks();
    });

    it('handles 0 action points edge case', () => {
      const attacker = createMockCell({
        id: 'zero-ap',
        owner: Owner.PLAYER,
        population: 10,
      });
      const defender = createMockCell({
        id: 'target',
        defense: 5,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = resolveBattle(attacker, defender, 0, 0);
      // attackPower = (0 + 1 + 1.25) * 1 = 2.25, defensePower = 5 + 1 = 6
      expect(result.attackPower).toBeCloseTo(2.25, 10);
      expect(result.defensePower).toBe(6);
      expect(result.success).toBe(false);
      vi.restoreAllMocks();
    });

    it('handles maximum population edge case', () => {
      const attacker = createMockCell({
        id: 'max-pop',
        owner: Owner.PLAYER,
        population: 100,
      });
      const defender = createMockCell({
        id: 'target',
        defense: 1,
      });

      vi.spyOn(Math, 'random').mockReturnValue(0);
      const result = resolveBattle(attacker, defender, 10, 0);
      // attackPower = (10 + 10 + 1.25) * 1 = 21.25, defensePower = 1 + 1 = 2
      expect(result.attackPower).toBeCloseTo(21.25, 10);
      expect(result.defensePower).toBe(2);
      expect(result.success).toBe(true);
      vi.restoreAllMocks();
    });
  });
});
