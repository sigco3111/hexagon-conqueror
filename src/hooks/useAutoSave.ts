import { useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { useBattleStore } from '@/stores/battleStore';
import { GamePhase } from '@/types/game';
import { saveGameState } from '@/utils/gameSave';

export function useAutoSave(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleSave = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const phase = useGameStore.getState().phase;
        if (phase === GamePhase.PLAYER_TURN || phase === GamePhase.AI_TURN) {
          saveGameState();
        }
      }, 500);
    };

    const unsub1 = useGameStore.subscribe(scheduleSave);
    const unsub2 = useMapStore.subscribe(scheduleSave);
    const unsub3 = useBattleStore.subscribe(scheduleSave);

    scheduleSave();

    return () => {
      if (timer) clearTimeout(timer);
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);
}
