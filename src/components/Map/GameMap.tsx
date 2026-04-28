import { useMemo } from 'react';
import { Map, useControl } from 'react-map-gl';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { Layer } from '@deck.gl/core';
import { Owner, type HexCell } from '@/types/game';
import { createHexagonLayer } from './HexagonLayer';
import { useMapStore } from '@/stores/mapStore';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/hooks/useGame';

import 'maplibre-gl/dist/maplibre-gl.css';

interface DeckGLOverlayProps {
  layers: Layer[];
}

function DeckGLOverlay({ layers }: DeckGLOverlayProps) {
  const overlay = useControl(() => new MapboxOverlay({ interleaved: true }));
  overlay.setProps({ layers });
  return null;
}

function generateHexBoundary(
  lat: number,
  lng: number,
  size: number,
): [number, number][] {
  const vertices: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    vertices.push([
      lng + size * Math.cos(angle),
      lat + size * Math.sin(angle),
    ]);
  }
  return vertices;
}

function generateMockCells(): HexCell[] {
  const centerLat = 37.5665;
  const centerLng = 126.978;
  const size = 0.008;

  const offsets: Array<{ dlat: number; dlng: number; owner: Owner }> = [
    { dlat: 0, dlng: 0, owner: Owner.PLAYER },
    { dlat: size * 1.5, dlng: (size * Math.sqrt(3)) / 2, owner: Owner.AI },
    { dlat: 0, dlng: size * Math.sqrt(3), owner: Owner.NEUTRAL },
    {
      dlat: -size * 1.5,
      dlng: (size * Math.sqrt(3)) / 2,
      owner: Owner.NEUTRAL,
    },
    {
      dlat: -size * 1.5,
      dlng: (-size * Math.sqrt(3)) / 2,
      owner: Owner.NEUTRAL,
    },
    { dlat: 0, dlng: -size * Math.sqrt(3), owner: Owner.NEUTRAL },
    {
      dlat: size * 1.5,
      dlng: (-size * Math.sqrt(3)) / 2,
      owner: Owner.NEUTRAL,
    },
  ];

  return offsets.map((offset, i) => {
    const lat = centerLat + offset.dlat;
    const lng = centerLng + offset.dlng;
    return {
      id: `mock-${i}`,
      center: [lat, lng] as [number, number],
      boundary: generateHexBoundary(lat, lng, size),
      neighbors: offsets
        .map((_, j) => `mock-${j}`)
        .filter((_, j) => j !== i),
      owner: offset.owner,
      defense: 3 + i,
      population: 20 + i * 10,
      resources: 10 + i * 5,
      region: '서울',
    };
  });
}

export interface GameMapProps {
  cells?: HexCell[];
}

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const INITIAL_VIEW_STATE = {
  latitude: 36.5,
  longitude: 127.8,
  zoom: 6,
};

export function GameMap({ cells: cellsProp }: GameMapProps) {
  const mapCells = useMapStore((s) => s.cells);
  const selectedCellId = useGameStore((s) => s.selectedCellId);
  const targetCellId = useGameStore((s) => s.targetCellId);
  const setHoveredCellId = useMapStore((s) => s.setHoveredCellId);
  const { handleCellClick, getValidTargets } = useGame();

  const effectiveCells = cellsProp ?? Object.values(mapCells);
  const validTargets = getValidTargets();
  const validTargetIds = validTargets.map((c) => c.id);

  const isLoading = effectiveCells.length === 0;

  const layers = useMemo(
    () => [
      createHexagonLayer({
        cells: isLoading ? generateMockCells() : effectiveCells,
        selectedCellId,
        targetCellId,
        validTargetIds,
        onClick: handleCellClick,
        onHover: setHoveredCellId,
      }),
    ],
    [effectiveCells, isLoading, selectedCellId, targetCellId, validTargetIds, handleCellClick, setHoveredCellId],
  );

  return (
    <div className="w-full h-full relative">
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
      >
        <DeckGLOverlay layers={layers} />
      </Map>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 pointer-events-none">
          <span className="text-gray-400 text-sm animate-pulse">지도를 불러오는 중...</span>
        </div>
      )}
    </div>
  );
}
