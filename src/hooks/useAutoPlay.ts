import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { resolveBattle } from '@/utils/battleCalc';
import { playerAutoPlayStrategy } from '@/utils/aiStrategy';
import { GamePhase, Owner } from '@/types/game';

const AUTO_PLAY_DELAY_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useAutoPlay(): void {
  const autoPlay = useGameStore(s => s.autoPlay);
  const phase = useGameStore(s => s.phase);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!autoPlay || phase !== GamePhase.PLAYER_TURN) {
      runningRef.current = false;
      return;
    }
    if (runningRef.current) return;
    runningRef.current = true;

    const run = async () => {
      while (runningRef.current) {
        const gs = useGameStore.getState();
        if (!gs.autoPlay || gs.phase !== GamePhase.PLAYER_TURN) break;

        if (gs.actionPoints <= 0) {
          gs.selectCell(null);
          gs.targetCell(null);
          gs.setPhase(GamePhase.AI_TURN);
          break;
        }

        const cells = useMapStore.getState().cells;
        const move = playerAutoPlayStrategy({
          cells,
          actionPoints: gs.actionPoints,
          consecutiveWins: gs.consecutiveWins,
        });

        if (!move) {
          gs.selectCell(null);
          gs.targetCell(null);
          gs.setPhase(GamePhase.AI_TURN);
          break;
        }

        gs.selectCell(move.fromCellId);
        await delay(200);
        if (!runningRef.current) break;

        gs.targetCell(move.toCellId);
        await delay(300);
        if (!runningRef.current) break;

        const attackerCell = useMapStore.getState().getCell(move.fromCellId);
        const defenderCell = useMapStore.getState().getCell(move.toCellId);
        if (!attackerCell || !defenderCell) break;

        const result = resolveBattle(attackerCell, defenderCell, gs.actionPoints, gs.consecutiveWins);

        if (result.success) {
          useMapStore.getState().updateCellOwner(move.toCellId, Owner.PLAYER);
          const updatedCell = useMapStore.getState().getCell(move.toCellId);
          if (updatedCell) {
            const conquestBonus = Math.floor(updatedCell.resources / 20);
            if (conquestBonus > 0) {
              useMapStore.getState().modifyCellDefense(move.toCellId, conquestBonus);
            }
          }
          useGameStore.getState().addConsecutiveWin();
        } else {
          useGameStore.getState().resetConsecutiveWins();
        }

        useGameStore.getState().consumeActionPoint();
        useBattleStore.getState().addBattleResult(result);
        useGameStore.getState().setLastBattleResult(result);
        useGameStore.getState().selectCell(null);
        useGameStore.getState().targetCell(null);

        const updatedCells = Object.values(useMapStore.getState().cells);
        const playerCells = updatedCells.filter(c => c.owner === Owner.PLAYER);
        if (updatedCells.length > 0 && playerCells.length === updatedCells.length) {
          useGameStore.getState().setWinner(Owner.PLAYER);
          break;
        }

        const currentGS = useGameStore.getState();
        if (!currentGS.hasFortified && currentGS.actionPoints > 0) {
          const playerCells = useMapStore.getState().getPlayerCells();
          const fortifiable = playerCells
            .filter(c => c.resources >= 20)
            .sort((a, b) => a.defense - b.defense);
          if (fortifiable.length > 0) {
            const fortTarget = fortifiable[0]!;
            useMapStore.getState().modifyCellDefense(fortTarget.id, 1);
            useMapStore.getState().modifyCellResources(fortTarget.id, -20);
            useGameStore.getState().consumeActionPoint();
            useGameStore.getState().setHasFortified(true);
          }
        }

        await delay(AUTO_PLAY_DELAY_MS);
      }
      runningRef.current = false;
    };

    run();
    return () => { runningRef.current = false; };
  }, [autoPlay, phase]);
}
