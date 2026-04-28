import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { resolveBattle } from '@/utils/battleCalc';
import { getAIStrategy, type AIState } from '@/utils/aiStrategy';
import { Owner } from '@/types/game';

const AI_TURN_DELAY_MS = 500;
const BASE_AP = 3;
const AP_PER_TEN_CELLS = 1;

export function useAI(): {
  executeAITurn: () => Promise<void>;
} {
  const executeAITurn = async (): Promise<void> => {
    const gameStore = useGameStore.getState();
    const aiCells = useMapStore.getState().getAICells();
    const aiTotalResources = useMapStore.getState().getOwnerTotalResources(Owner.AI);
    const actionPoints = gameStore.calculateActionPoints(aiCells.length, BASE_AP, AP_PER_TEN_CELLS)
      + Math.floor(aiTotalResources / 50);
    let aiConsecutiveWins = 0;
    let remainingAP = actionPoints;

    const strategy = getAIStrategy(gameStore.difficulty);

    while (remainingAP > 0) {
      const currentState: AIState = {
        cells: { ...useMapStore.getState().cells },
        actionPoints: remainingAP,
        consecutiveWins: aiConsecutiveWins,
      };

      const move = strategy(currentState);
      if (!move) break;

      const attackerCell = useMapStore.getState().getCell(move.fromCellId);
      const defenderCell = useMapStore.getState().getCell(move.toCellId);
      if (!attackerCell || !defenderCell) break;

      const result = resolveBattle(attackerCell, defenderCell, remainingAP, aiConsecutiveWins);

      if (result.success) {
        useMapStore.getState().updateCellOwner(move.toCellId, Owner.AI);
        const capturedCell = useMapStore.getState().getCell(move.toCellId);
        if (capturedCell) {
          const conquestBonus = Math.floor(capturedCell.resources / 20);
          if (conquestBonus > 0) {
            useMapStore.getState().modifyCellDefense(move.toCellId, conquestBonus);
          }
        }
        aiConsecutiveWins++;
      } else {
        aiConsecutiveWins = 0;
      }

      useBattleStore.getState().addBattleResult(result);
      remainingAP--;

      await new Promise(resolve => setTimeout(resolve, AI_TURN_DELAY_MS));
    }

    let aiRemainingAP = remainingAP;
    if (aiRemainingAP > 0) {
      const aiOwnedCells = useMapStore.getState().getAICells();
      const fortifiable = aiOwnedCells
        .filter(c => c.resources >= 20)
        .sort((a, b) => a.defense - b.defense);

      if (fortifiable.length > 0) {
        const target = fortifiable[0]!;
        useMapStore.getState().modifyCellDefense(target.id, 1);
        useMapStore.getState().modifyCellResources(target.id, -20);
        aiRemainingAP--;
      }
    }

    const updatedCells = Object.values(useMapStore.getState().cells);
    const allPlayerCells = updatedCells.filter(c => c.owner === Owner.PLAYER);

    if (updatedCells.length > 0 && allPlayerCells.length === 0) {
      useGameStore.getState().setWinner(Owner.AI);
      return;
    }

    useGameStore.getState().nextTurn();

    const playerCells = useMapStore.getState().getPlayerCells();
    const playerResources = useMapStore.getState().getOwnerTotalResources(Owner.PLAYER);
    const playerAP = useGameStore.getState().calculateActionPoints(playerCells.length, BASE_AP, AP_PER_TEN_CELLS)
      + Math.floor(playerResources / 50);
    useGameStore.getState().setActionPoints(playerAP);
  };

  return { executeAITurn };
}
