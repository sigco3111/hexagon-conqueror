import { GeoJsonLayer } from '@deck.gl/layers';
import type { Layer } from '@deck.gl/core';
import type { HexCell, Owner } from '@/types/game';

const OWNER_COLORS: Record<Owner, [number, number, number]> = {
  PLAYER: [59, 130, 246],
  AI: [239, 68, 68],
  NEUTRAL: [107, 114, 128],
};

interface CellProperties {
  id: string;
  owner: Owner;
  defense: number;
  population: number;
  resources: number;
  region: string;
}

function cellsToGeoJSON(cells: HexCell[]) {
  return {
    type: 'FeatureCollection' as const,
    features: cells.map((cell) => ({
      type: 'Feature' as const,
      properties: {
        id: cell.id,
        owner: cell.owner,
        defense: cell.defense,
        population: cell.population,
        resources: cell.resources,
        region: cell.region,
      } satisfies CellProperties,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[...cell.boundary, cell.boundary[0]!]],
      },
    })),
  };
}

export interface HexagonLayerProps {
  cells: HexCell[];
  selectedCellId?: string | null;
  targetCellId?: string | null;
  validTargetIds?: string[];
  onClick?: (cellId: string) => void;
  onHover?: (cellId: string | null) => void;
}

export function createHexagonLayer({
  cells,
  selectedCellId,
  targetCellId,
  validTargetIds = [],
  onClick,
  onHover,
}: HexagonLayerProps): Layer {
  const data = cellsToGeoJSON(cells);
  const validTargetSet = new Set(validTargetIds);

  return new GeoJsonLayer({
    id: 'hexagon-layer',
    data,
    pickable: true,
    autoHighlight: true,
    extruded: true,
    getFillColor: (d: { properties: CellProperties }) => {
      const base = OWNER_COLORS[d.properties.owner] ?? OWNER_COLORS.NEUTRAL;
      if (validTargetSet.has(d.properties.id)) {
        return [base[0], base[1], base[2], 220];
      }
      return base;
    },
    getElevation: (d: { properties: CellProperties }) => {
      return d.properties.defense * 1000;
    },
    getLineColor: (d: { properties: CellProperties }) => {
      if (d.properties.id === selectedCellId) {
        return [251, 191, 36, 255] as [number, number, number, number];
      }
      if (d.properties.id === targetCellId) {
        return [239, 68, 68, 255] as [number, number, number, number];
      }
      if (validTargetSet.has(d.properties.id)) {
        return [251, 191, 36, 140] as [number, number, number, number];
      }
      return [255, 255, 255, 80] as [number, number, number, number];
    },
    getLineWidth: (d: { properties: CellProperties }) => {
      if (d.properties.id === selectedCellId || d.properties.id === targetCellId) {
        return 3;
      }
      return 1;
    },
    lineWidthMinPixels: 1,
    onClick: (info: { object?: { properties: CellProperties } }) => {
      if (info.object && onClick) {
        onClick(info.object.properties.id);
      }
    },
    onHover: (info: { object?: { properties: CellProperties } }) => {
      if (onHover) {
        onHover(info.object ? info.object.properties.id : null);
      }
    },
    updateTriggers: {
      getFillColor: [
        cells.map((c) => c.owner).join(','),
        validTargetIds.join(','),
      ].join('|'),
      getElevation: cells.map((c) => c.defense).join(','),
      getLineColor: [selectedCellId, targetCellId, validTargetIds.join(',')].join('|'),
      getLineWidth: [selectedCellId, targetCellId].join('|'),
    },
  });
}

export { OWNER_COLORS };
export type { CellProperties };
