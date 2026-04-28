import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameMap } from './GameMap';
import { createHexagonLayer, OWNER_COLORS } from './HexagonLayer';
import { Owner } from '@/types/game';
import { createMockCellGrid } from '@/test/testUtils';

vi.mock('maplibre-gl', () => ({
  Map: vi.fn(),
  NavigationControl: vi.fn(),
}));

vi.mock('react-map-gl', () => ({
  Map: (props: { children?: React.ReactNode }) => (
    <div data-testid="mock-map">{props.children}</div>
  ),
  useControl: vi.fn(() => ({ setProps: vi.fn() })),
  NavigationControl: () => <div />,
}));

vi.mock('@deck.gl/mapbox', () => ({
  MapboxOverlay: vi.fn(() => ({
    setProps: vi.fn(),
    onAdd: vi.fn(() => document.createElement('div')),
    onRemove: vi.fn(),
  })),
}));

vi.mock('@deck.gl/layers', () => ({
  GeoJsonLayer: vi.fn().mockImplementation(function (this: object, props: object) {
    Object.assign(this, props);
    return this;
  }),
}));

describe('GameMap', () => {
  it('renders without errors', () => {
    render(<GameMap />);
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  it('renders with custom cells', () => {
    const cells = createMockCellGrid(3);
    render(<GameMap cells={cells} />);
    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });
});

describe('createHexagonLayer', () => {
  it('creates a layer from cells', () => {
    const cells = createMockCellGrid(3);
    const layer = createHexagonLayer({ cells });
    expect(layer).toBeDefined();
    expect((layer as unknown as Record<string, unknown>).id).toBe('hexagon-layer');
  });

  it('passes correct GeoJSON data to layer', () => {
    const cells = createMockCellGrid(2);
    const layer = createHexagonLayer({ cells });
    const data = (layer as unknown as Record<string, unknown>).data as {
      type: string;
      features: unknown[];
    };
    expect(data.type).toBe('FeatureCollection');
    expect(data.features).toHaveLength(2);
  });
});

describe('OWNER_COLORS', () => {
  it('has colors for all owner types', () => {
    expect(OWNER_COLORS[Owner.PLAYER]).toEqual([59, 130, 246]);
    expect(OWNER_COLORS[Owner.AI]).toEqual([239, 68, 68]);
    expect(OWNER_COLORS[Owner.NEUTRAL]).toEqual([107, 114, 128]);
  });
});
