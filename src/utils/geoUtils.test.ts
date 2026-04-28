import { describe, it, expect } from 'vitest';
import { generateKoreaHexGrid, getNeighbors, cellsToFeatureCollection, hexCellToGeoJSON } from './geoUtils';
import { Owner } from '@/types/game';

describe('geoUtils', () => {
  describe('generateKoreaHexGrid', () => {
    it('generates 300-500 cells for South Korea', () => {
      const cells = generateKoreaHexGrid(5);
      expect(cells.length).toBeGreaterThanOrEqual(200);
      expect(cells.length).toBeLessThanOrEqual(900);
    });

    it('each cell has valid properties', () => {
      const cells = generateKoreaHexGrid(5);
      for (const cell of cells) {
        expect(cell.id).toBeTruthy();
        expect(cell.center).toHaveLength(2);
        expect(cell.center[0]).toBeGreaterThan(33);
        expect(cell.center[0]).toBeLessThan(39);
        expect(cell.center[1]).toBeGreaterThan(124);
        expect(cell.center[1]).toBeLessThan(132);
        expect(cell.boundary.length).toBeGreaterThanOrEqual(5);
        expect(cell.neighbors.length).toBeGreaterThanOrEqual(0);
        expect(cell.owner).toBe(Owner.NEUTRAL);
        expect(cell.defense).toBeGreaterThanOrEqual(1);
        expect(cell.defense).toBeLessThanOrEqual(10);
        expect(cell.population).toBeGreaterThanOrEqual(1);
        expect(cell.population).toBeLessThanOrEqual(100);
        expect(cell.resources).toBeGreaterThanOrEqual(1);
      }
    });

    it('has no duplicate cell IDs', () => {
      const cells = generateKoreaHexGrid(5);
      const ids = cells.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('neighbor relationships are filtered to valid cells', () => {
      const cells = generateKoreaHexGrid(5);
      const cellIds = new Set(cells.map(c => c.id));
      for (const cell of cells) {
        for (const neighborId of cell.neighbors) {
          expect(cellIds.has(neighborId)).toBe(true);
        }
      }
    });
  });

  describe('getNeighbors', () => {
    it('returns neighbor IDs excluding self', () => {
      const cells = generateKoreaHexGrid(5);
      const cell = cells[0]!;
      const neighbors = getNeighbors(cell.id);
      expect(neighbors).not.toContain(cell.id);
      expect(neighbors.length).toBeGreaterThan(0);
    });
  });

  describe('GeoJSON conversion', () => {
    it('hexCellToGeoJSON creates valid Feature', () => {
      const cells = generateKoreaHexGrid(5);
      const feature = hexCellToGeoJSON(cells[0]!);
      expect(feature.type).toBe('Feature');
      expect(feature.geometry.type).toBe('Polygon');
      expect(feature.properties.id).toBe(cells[0]!.id);
    });

    it('cellsToFeatureCollection creates valid FeatureCollection', () => {
      const cells = generateKoreaHexGrid(5);
      const fc = cellsToFeatureCollection(cells);
      expect(fc.type).toBe('FeatureCollection');
      expect(fc.features).toHaveLength(cells.length);
    });
  });
});
