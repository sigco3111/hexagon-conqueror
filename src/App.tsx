import { useEffect, useRef } from 'react';
import { GamePhase, type Difficulty } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/hooks/useGame';
import { useAI } from '@/hooks/useAI';
import { GameBoard } from '@/components/Game/GameBoard';
import { StartScreen } from '@/components/Game/StartScreen';
import { GameOverOverlay } from '@/components/Game/GameOverOverlay';
import { restoreGameState, loadGameState, clearSaveState } from '@/utils/gameSave';

export default function App() {
  const phase = useGameStore((s) => s.phase);
  const winner = useGameStore((s) => s.winner);
  const { initNewGame } = useGame();
  const { executeAITurn } = useAI();
  const aiRunningRef = useRef(false);

  const handleStart = (difficulty: Difficulty) => {
    clearSaveState();
    initNewGame(difficulty);
  };

  useEffect(() => {
    if (phase === GamePhase.AI_TURN && !aiRunningRef.current) {
      aiRunningRef.current = true;
      executeAITurn().finally(() => {
        aiRunningRef.current = false;
      });
    }
  }, [phase, executeAITurn]);

  if (phase === GamePhase.SETUP) {
    return (
      <StartScreen
        onStart={handleStart}
        onResume={() => {
          const data = loadGameState();
          if (data) {
            restoreGameState(data);
          }
        }}
      />
    );
  }

  return (
    <div className="w-full h-full relative">
      <GameBoard />
      {winner && (
        <GameOverOverlay
          winner={winner}
          onRestart={() => initNewGame(useGameStore.getState().difficulty)}
        />
      )}
    </div>
  );
}
