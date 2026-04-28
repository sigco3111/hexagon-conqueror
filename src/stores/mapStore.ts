import { create } from 'zustand';
import { Owner, type HexCell } from '@/types/game';

interface MapState {
  cells: Record<string, HexCell>;
  hoveredCellId: string | null;
}

interface MapActions {
  loadCells: (cells: HexCell[]) => void;
  updateCell: (id: string, updates: Partial<HexCell>) => void;
  updateCellOwner: (id: string, owner: Owner) => void;
  getCell: (id: string) => HexCell | undefined;
  getAdjacentCells: (id: string) => HexCell[];
  getPlayerCells: () => HexCell[];
  getAICells: () => HexCell[];
  getNeutralCells: () => HexCell[];
  setHoveredCellId: (id: string | null) => void;
  modifyCellDefense: (id: string, delta: number) => void;
  modifyCellResources: (id: string, delta: number) => void;
  getOwnerTotalResources: (owner: Owner) => number;
}

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  cells: {},
  hoveredCellId: null,

  loadCells: (cells) => {
    const cellMap: Record<string, HexCell> = {};
    cells.forEach(cell => {
      cellMap[cell.id] = cell;
    });
    set({ cells: cellMap });
  },

  updateCell: (id, updates) => {
    set(state => {
      if (!state.cells[id]) return state;
      return {
        cells: {
          ...state.cells,
          [id]: { ...state.cells[id], ...updates },
        },
      };
    });
  },

  updateCellOwner: (id, owner) => {
    set(state => {
      if (!state.cells[id]) return state;
      return {
        cells: {
          ...state.cells,
          [id]: { ...state.cells[id], owner },
        },
      };
    });
  },

  getCell: (id) => {
    return get().cells[id];
  },

  getAdjacentCells: (id) => {
    const cell = get().cells[id];
    if (!cell) return [];
    return cell.neighbors.map(nid => get().cells[nid]).filter(Boolean) as HexCell[];
  },

  getPlayerCells: () => {
    return Object.values(get().cells).filter(cell => cell.owner === Owner.PLAYER);
  },

  getAICells: () => {
    return Object.values(get().cells).filter(cell => cell.owner === Owner.AI);
  },

  getNeutralCells: () => {
    return Object.values(get().cells).filter(cell => cell.owner === Owner.NEUTRAL);
  },

  setHoveredCellId: (id) => {
    set({ hoveredCellId: id });
  },

  modifyCellDefense: (id, delta) => {
    set(state => {
      const cell = state.cells[id];
      if (!cell) return state;
      return {
        cells: {
          ...state.cells,
          [id]: { ...cell, defense: Math.max(0, cell.defense + delta) },
        },
      };
    });
  },

  modifyCellResources: (id, delta) => {
    set(state => {
      const cell = state.cells[id];
      if (!cell) return state;
      return {
        cells: {
          ...state.cells,
          [id]: { ...cell, resources: Math.max(0, cell.resources + delta) },
        },
      };
    });
  },

  getOwnerTotalResources: (owner) => {
    return Object.values(get().cells)
      .filter(cell => cell.owner === owner)
      .reduce((sum, cell) => sum + cell.resources, 0);
  },
}));
