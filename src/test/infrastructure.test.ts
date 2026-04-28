import { describe, it, expect } from 'vitest';
import { Owner } from '@/types/game';
import { createMockCell } from '@/test/testUtils';

describe('test infrastructure', () => {
  it('creates a mock cell with defaults', () => {
    const cell = createMockCell();
    expect(cell.owner).toBe(Owner.NEUTRAL);
    expect(cell.defense).toBe(5);
    expect(cell.population).toBe(50);
  });

  it('overrides mock cell properties', () => {
    const cell = createMockCell({ owner: Owner.PLAYER, defense: 10 });
    expect(cell.owner).toBe(Owner.PLAYER);
    expect(cell.defense).toBe(10);
  });
});
