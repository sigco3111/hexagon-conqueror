import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '@/stores/mapStore';
import { useGameStore } from '@/stores/gameStore';
import { GameMap } from '@/components/Map/GameMap';
import { TurnIndicator } from '@/components/UI/TurnIndicator';
import { ResourceBar } from '@/components/UI/ResourceBar';
import { ActionMenu } from '@/components/UI/ActionMenu';
import { CellInfo } from '@/components/Game/CellInfo';
import { BattleLog } from '@/components/Game/BattleLog';
import { BattleToast } from '@/components/Game/BattleToast';
import { HelpModal } from '@/components/Game/HelpModal';
import { GamePhase } from '@/types/game';
import { useAutoPlay } from '@/hooks/useAutoPlay';
import { useAutoSave } from '@/hooks/useAutoSave';

export function GameBoard() {
  const cells = useMapStore((s) => s.cells);
  const phase = useGameStore((s) => s.phase);
  const turn = useGameStore((s) => s.turn);
  const [showHelp, setShowHelp] = useState(false);
  const prevPhaseRef = useRef(phase);

  useAutoPlay();
  useAutoSave();

  useEffect(() => {
    if (prevPhaseRef.current === GamePhase.SETUP && phase === GamePhase.PLAYER_TURN && turn === 1) {
      setShowHelp(true);
    }
    prevPhaseRef.current = phase;
  }, [phase, turn]);

  const cellList = Object.values(cells);
  const isAITurn = phase === GamePhase.AI_TURN;

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 text-white overflow-hidden">
      <BattleToast />
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-800/90 border-b border-gray-700 shrink-0 sm:px-4">
        <TurnIndicator />
        <div className="flex items-center gap-2">
          <ResourceBar />
          <button
            onClick={() => setShowHelp(true)}
            className="px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm font-medium cursor-pointer"
            title="게임 도움말"
          >
            ❓
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex w-[280px] shrink-0 border-r border-gray-700 overflow-y-auto bg-gray-850">
          <div className="w-full p-2">
            <BattleLog />
          </div>
        </aside>

        <div className="flex-1 relative min-w-0">
          <GameMap cells={cellList.length > 0 ? cellList : undefined} />
          {isAITurn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/40 pointer-events-none z-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/90 border border-red-800/50 text-red-400 text-sm font-medium">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
                AI 생각 중...
              </div>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex w-[300px] shrink-0 border-l border-gray-700 overflow-y-auto">
          <div className="w-full">
            <CellInfo />
          </div>
        </aside>
      </div>

      <div className="shrink-0 border-t border-gray-700 bg-gray-800/90">
        {isAITurn ? (
          <div className="flex items-center justify-center h-14 text-sm text-gray-500">
            AI 턴 — 대기 중...
          </div>
        ) : (
          <ActionMenu />
        )}
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
