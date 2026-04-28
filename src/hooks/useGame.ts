import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { resolveBattle } from '@/utils/battleCalc';
import { type Difficulty, GamePhase, Owner, type HexCell } from '@/types/game';
import koreaHexGridData from '@/data/koreaHexGrid.json';
import { clearSaveState } from '@/utils/gameSave';

const MIN_START_DISTANCE = 10;

export interface UseGameReturn {
  initNewGame: (difficulty: Difficulty) => void;
  handleCellClick: (cellId: string) => void;
  executeAttack: () => void;
  endPlayerTurn: () => void;
  isAdjacent: (cellId1: string, cellId2: string) => boolean;
  getValidTargets: () => HexCell[];
  fortifyCell: () => void;
}

function findDistantCellIds(
  cellMap: Record<string, HexCell>,
  startId: string,
  minDistance: number,
): string[] {
  const distances = new Map<string, number>();
  const queue: Array<[string, number]> = [[startId, 0]];
  distances.set(startId, 0);

  while (queue.length > 0) {
    const [currentId, dist] = queue.shift()!;
    const cell = cellMap[currentId];
    if (!cell) continue;

    for (const neighborId of cell.neighbors) {
      if (!distances.has(neighborId)) {
        distances.set(neighborId, dist + 1);
        queue.push([neighborId, dist + 1]);
      }
    }
  }

  return Array.from(distances.entries())
    .filter(([, dist]) => dist >= minDistance)
    .map(([id]) => id);
}

export function useGame(): UseGameReturn {
  const initNewGame = (difficulty: Difficulty): void => {
    const gameStore = useGameStore.getState();
    const mapStore = useMapStore.getState();
    const battleStore = useBattleStore.getState();

    const rawCells = koreaHexGridData as HexCell[];
    const cells = rawCells.map((cell) => ({
      ...cell,
      owner: Owner.NEUTRAL,
    }));

    const cellMap: Record<string, HexCell> = {};
    cells.forEach((cell) => {
      cellMap[cell.id] = cell;
    });

    const cellIds = cells.map((c) => c.id);
    const playerStartIdx = Math.floor(Math.random() * cellIds.length);
    const playerStartId = cellIds[playerStartIdx]!;

    const distantIds = findDistantCellIds(cellMap, playerStartId, MIN_START_DISTANCE);

    let aiStartId: string;
    if (distantIds.length > 0) {
      aiStartId = distantIds[Math.floor(Math.random() * distantIds.length)]!;
    } else {
      const fallbackIds = cellIds.filter((id) => id !== playerStartId);
      aiStartId = fallbackIds[Math.floor(Math.random() * fallbackIds.length)]!;
    }

    const playerCell = cellMap[playerStartId];
    const aiCell = cellMap[aiStartId];
    if (playerCell) playerCell.owner = Owner.PLAYER;
    if (aiCell) aiCell.owner = Owner.AI;

    mapStore.loadCells(cells);
    gameStore.initGame(difficulty);
    battleStore.clearLog();
  };

  const handleCellClick = (cellId: string): void => {
    const gameStore = useGameStore.getState();
    const mapStore = useMapStore.getState();

    if (gameStore.phase !== GamePhase.PLAYER_TURN) return;

    if (gameStore.autoPlay) {
      gameStore.toggleAutoPlay();
    }

    const cell = mapStore.getCell(cellId);
    if (!cell) return;

    const { selectedCellId } = gameStore;

    if (cellId === selectedCellId) {
      gameStore.selectCell(null);
      gameStore.targetCell(null);
      return;
    }

    if (cell.owner === Owner.PLAYER) {
      gameStore.selectCell(cellId);
      gameStore.targetCell(null);
      return;
    }

    if (selectedCellId) {
      const selectedCell = mapStore.getCell(selectedCellId);
      if (selectedCell && selectedCell.neighbors.includes(cellId)) {
        gameStore.targetCell(cellId);
      }
    }
  };

  const executeAttack = (): void => {
    const gameStore = useGameStore.getState();
    const mapStore = useMapStore.getState();
    const battleStore = useBattleStore.getState();

    const { selectedCellId, targetCellId, actionPoints, consecutiveWins } = gameStore;

    if (!selectedCellId || !targetCellId) return;
    if (actionPoints <= 0) return;

    const attackerCell = mapStore.getCell(selectedCellId);
    const defenderCell = mapStore.getCell(targetCellId);
    if (!attackerCell || !defenderCell) return;

    const result = resolveBattle(attackerCell, defenderCell, actionPoints, consecutiveWins);

    if (result.success) {
      mapStore.updateCellOwner(targetCellId, Owner.PLAYER);
      const conquestBonus = Math.floor(defenderCell.resources / 20);
      if (conquestBonus > 0) {
        mapStore.modifyCellDefense(targetCellId, conquestBonus);
      }
      gameStore.addConsecutiveWin();
    } else {
      gameStore.resetConsecutiveWins();
    }

    gameStore.consumeActionPoint();
    battleStore.addBattleResult(result);
    gameStore.setLastBattleResult(result);
    gameStore.selectCell(null);
    gameStore.targetCell(null);

    const updatedCells = Object.values(useMapStore.getState().cells);
    const playerCells = updatedCells.filter((c) => c.owner === Owner.PLAYER);
    if (updatedCells.length > 0 && playerCells.length === updatedCells.length) {
      gameStore.setWinner(Owner.PLAYER);
      clearSaveState();
    }
  };

  const endPlayerTurn = (): void => {
    const gameStore = useGameStore.getState();
    gameStore.selectCell(null);
    gameStore.targetCell(null);
    gameStore.setPhase(GamePhase.AI_TURN);
  };

  const isAdjacent = (cellId1: string, cellId2: string): boolean => {
    const cell1 = useMapStore.getState().getCell(cellId1);
    if (!cell1) return false;
    return cell1.neighbors.includes(cellId2);
  };

  const getValidTargets = (): HexCell[] => {
    const { selectedCellId } = useGameStore.getState();
    if (!selectedCellId) return [];

    const mapStore = useMapStore.getState();
    const adjacentCells = mapStore.getAdjacentCells(selectedCellId);
    return adjacentCells.filter((cell) => cell.owner !== Owner.PLAYER);
  };

  const fortifyCell = (): void => {
    const gameStore = useGameStore.getState();
    const mapStore = useMapStore.getState();

    if (gameStore.phase !== GamePhase.PLAYER_TURN) return;
    if (gameStore.hasFortified) return;
    if (gameStore.actionPoints <= 0) return;

    const { selectedCellId } = gameStore;
    if (!selectedCellId) return;

    const cell = mapStore.getCell(selectedCellId);
    if (!cell) return;
    if (cell.owner !== Owner.PLAYER) return;
    if (cell.resources < 20) return;

    mapStore.modifyCellDefense(selectedCellId, 1);
    mapStore.modifyCellResources(selectedCellId, -20);
    gameStore.consumeActionPoint();
    gameStore.setHasFortified(true);
  };

  return { initNewGame, handleCellClick, executeAttack, endPlayerTurn, isAdjacent, getValidTargets, fortifyCell };
}
