import { polygonToCells, gridDisk, cellToBoundary, cellToLatLng } from 'h3-js';
import { HexCell, Owner } from '@/types/game';

export const KOREA_BOUNDARY: [number, number][][] = [
  [
    [38.6, 126.1], [38.2, 127.5], [38.1, 128.2], [37.7, 129.1],
    [37.2, 129.5], [36.0, 129.4], [35.2, 129.2], [34.9, 128.7],
    [34.5, 127.9], [34.3, 126.7], [34.5, 126.2], [35.0, 125.5],
    [36.0, 125.0], [37.0, 125.2], [38.0, 125.5], [38.6, 126.1],
  ],
  [
    [33.5, 126.2], [33.3, 126.5], [33.2, 126.8],
    [33.3, 127.0], [33.5, 126.9], [33.6, 126.6], [33.5, 126.2],
  ],
];

interface CityInfluence {
  lat: number;
  lng: number;
  radius: number;
  defenseBonus: number;
  populationBonus: number;
}

const MAJOR_CITIES: CityInfluence[] = [
  { lat: 37.5665, lng: 126.978, radius: 0.3, defenseBonus: 3, populationBonus: 40 },
  { lat: 35.1796, lng: 129.0756, radius: 0.25, defenseBonus: 2, populationBonus: 30 },
  { lat: 35.8714, lng: 128.6014, radius: 0.2, defenseBonus: 2, populationBonus: 25 },
  { lat: 36.3504, lng: 127.3845, radius: 0.15, defenseBonus: 1, populationBonus: 15 },
  { lat: 35.1595, lng: 126.8526, radius: 0.15, defenseBonus: 1, populationBonus: 15 },
  { lat: 35.5384, lng: 129.3114, radius: 0.15, defenseBonus: 1, populationBonus: 15 },
];

function getCityInfluence(lat: number, lng: number): { defense: number; population: number } {
  let defense = 0;
  let population = 0;
  for (const city of MAJOR_CITIES) {
    const dist = Math.sqrt((lat - city.lat) ** 2 + (lng - city.lng) ** 2);
    if (dist < city.radius) {
      const factor = 1 - dist / city.radius;
      defense += Math.round(city.defenseBonus * factor);
      population += Math.round(city.populationBonus * factor);
    }
  }
  return { defense, population };
}

export function generateKoreaHexGrid(resolution = 5): HexCell[] {
  const allCells: HexCell[] = [];

  for (const polygon of KOREA_BOUNDARY) {
    const h3Indexes = polygonToCells(polygon, resolution);
    
    for (const h3Index of h3Indexes) {
      const boundary = cellToBoundary(h3Index, true) as [number, number][];
      const latLng = cellToLatLng(h3Index);
      const center: [number, number] = [latLng[0], latLng[1]];
      const neighbors = gridDisk(h3Index, 1).filter(n => n !== h3Index) as string[];
      const cityInfluence = getCityInfluence(center[0], center[1]);

      const cell: HexCell = {
        id: h3Index,
        center,
        boundary,
        neighbors,
        owner: Owner.NEUTRAL,
        defense: Math.min(10, 2 + Math.floor(Math.random() * 4) + cityInfluence.defense),
        population: Math.min(100, 10 + Math.floor(Math.random() * 30) + cityInfluence.population),
        resources: 5 + Math.floor(Math.random() * 40),
        region: '',
      };
      allCells.push(cell);
    }
  }

  const validNeighborIds = new Set(allCells.map(c => c.id));
  return allCells.map(cell => ({
    ...cell,
    neighbors: cell.neighbors.filter(n => validNeighborIds.has(n)),
  }));
}

export function getNeighbors(cellId: string): string[] {
  return gridDisk(cellId, 1).filter(n => n !== cellId) as string[];
}

export function hexCellToGeoJSON(cell: HexCell) {
  return {
    type: 'Feature' as const,
    properties: {
      id: cell.id,
      owner: cell.owner,
      defense: cell.defense,
      population: cell.population,
      resources: cell.resources,
      region: cell.region,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [[...cell.boundary, cell.boundary[0]]],
    },
  };
}

export function cellsToFeatureCollection(cells: HexCell[]) {
  return {
    type: 'FeatureCollection' as const,
    features: cells.map(hexCellToGeoJSON),
  };
}
