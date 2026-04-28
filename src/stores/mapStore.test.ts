import { describe, it, expect, afterEach } from 'vitest';
import { useMapStore } from './mapStore';
import { Owner } from '@/types/game';
import { createMockCell, createMockCellGrid } from '@/test/testUtils';

afterEach(() => {
  useMapStore.getState().loadCells([]);
});

describe('mapStore', () => {
  it('loadCells loads cell data', () => {
    const cells = createMockCellGrid(3);
    useMapStore.getState().loadCells(cells);
    const state = useMapStore.getState();
    expect(Object.keys(state.cells)).toHaveLength(3);
    expect(state.cells['cell-0']).toBeDefined();
  });

  it('updateCellOwner changes ownership', () => {
    const cell = createMockCell({ id: 'c1', owner: Owner.NEUTRAL });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().updateCellOwner('c1', Owner.PLAYER);
    expect(useMapStore.getState().cells['c1']!.owner).toBe(Owner.PLAYER);
  });

  it('getAdjacentCells returns correct neighbors', () => {
    const cells = [
      createMockCell({ id: 'a', neighbors: ['b'] }),
      createMockCell({ id: 'b', neighbors: ['a', 'c'] }),
      createMockCell({ id: 'c', neighbors: ['b'] }),
    ];
    useMapStore.getState().loadCells(cells);
    const adj = useMapStore.getState().getAdjacentCells('b');
    expect(adj.map(c => c.id).sort()).toEqual(['a', 'c']);
  });

  it('getPlayerCells/getAICells/getNeutralCells filter correctly', () => {
    const cells = [
      createMockCell({ id: 'p', owner: Owner.PLAYER }),
      createMockCell({ id: 'a', owner: Owner.AI }),
      createMockCell({ id: 'n', owner: Owner.NEUTRAL }),
    ];
    useMapStore.getState().loadCells(cells);
    expect(useMapStore.getState().getPlayerCells().map(c => c.id)).toEqual(['p']);
    expect(useMapStore.getState().getAICells().map(c => c.id)).toEqual(['a']);
    expect(useMapStore.getState().getNeutralCells().map(c => c.id)).toEqual(['n']);
  });

  it('modifyCellDefense updates defense', () => {
    const cell = createMockCell({ id: 'c1', defense: 5 });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().modifyCellDefense('c1', 3);
    expect(useMapStore.getState().cells['c1']!.defense).toBe(8);
    useMapStore.getState().modifyCellDefense('c1', -2);
    expect(useMapStore.getState().cells['c1']!.defense).toBe(6);
  });

  it('modifyCellDefense floors at 0', () => {
    const cell = createMockCell({ id: 'c1', defense: 1 });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().modifyCellDefense('c1', -5);
    expect(useMapStore.getState().cells['c1']!.defense).toBe(0);
  });

  it('modifyCellResources updates resources', () => {
    const cell = createMockCell({ id: 'c1', resources: 30 });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().modifyCellResources('c1', -10);
    expect(useMapStore.getState().cells['c1']!.resources).toBe(20);
  });

  it('modifyCellResources floors at 0', () => {
    const cell = createMockCell({ id: 'c1', resources: 5 });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().modifyCellResources('c1', -20);
    expect(useMapStore.getState().cells['c1']!.resources).toBe(0);
  });

  it('getOwnerTotalResources returns sum for owner', () => {
    const cells = [
      createMockCell({ id: 'p1', owner: Owner.PLAYER, resources: 30 }),
      createMockCell({ id: 'p2', owner: Owner.PLAYER, resources: 20 }),
      createMockCell({ id: 'a1', owner: Owner.AI, resources: 50 }),
      createMockCell({ id: 'n1', owner: Owner.NEUTRAL, resources: 10 }),
    ];
    useMapStore.getState().loadCells(cells);
    expect(useMapStore.getState().getOwnerTotalResources(Owner.PLAYER)).toBe(50);
    expect(useMapStore.getState().getOwnerTotalResources(Owner.AI)).toBe(50);
    expect(useMapStore.getState().getOwnerTotalResources(Owner.NEUTRAL)).toBe(10);
  });

  it('modifyCellDefense does nothing for non-existent cell', () => {
    const cell = createMockCell({ id: 'c1', defense: 5 });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().modifyCellDefense('nonexistent', 3);
    expect(useMapStore.getState().cells['c1']!.defense).toBe(5);
  });

  it('modifyCellResources does nothing for non-existent cell', () => {
    const cell = createMockCell({ id: 'c1', resources: 30 });
    useMapStore.getState().loadCells([cell]);
    useMapStore.getState().modifyCellResources('nonexistent', -10);
    expect(useMapStore.getState().cells['c1']!.resources).toBe(30);
  });
});
