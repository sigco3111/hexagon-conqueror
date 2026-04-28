import { Owner, type HexCell } from '@/types/game';

export function createMockCell(overrides: Partial<HexCell> = {}): HexCell {
  return {
    id: '85283473fffffff',
    center: [37.5665, 126.978],
    boundary: [
      [126.97, 37.57],
      [126.98, 37.57],
      [126.985, 37.575],
      [126.98, 37.58],
      [126.97, 37.58],
      [126.965, 37.575],
    ],
    neighbors: ['85283477fffffff', '85283475fffffff'],
    owner: Owner.NEUTRAL,
    defense: 5,
    population: 50,
    resources: 25,
    region: '',
    ...overrides,
  };
}

export function createMockCellGrid(count: number): HexCell[] {
  const cells: HexCell[] = [];
  for (let i = 0; i < count; i++) {
    cells.push(
      createMockCell({
        id: `cell-${i}`,
        neighbors: i > 0 ? [`cell-${i - 1}`] : [],
      }),
    );
  }
  return cells;
}
