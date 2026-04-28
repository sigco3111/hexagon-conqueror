import { useGameStore } from '@/stores/gameStore';
import { GamePhase } from '@/types/game';

const PHASE_CONFIG: Record<GamePhase, { label: string; bg: string; text: string; border: string }> = {
  [GamePhase.SETUP]: {
    label: '준비',
    bg: 'bg-gray-800',
    text: 'text-gray-300',
    border: 'border-gray-600',
  },
  [GamePhase.PLAYER_TURN]: {
    label: '플레이어 턴',
    bg: 'bg-blue-950',
    text: 'text-player',
    border: 'border-player',
  },
  [GamePhase.AI_TURN]: {
    label: 'AI 턴',
    bg: 'bg-red-950',
    text: 'text-ai',
    border: 'border-ai',
  },
  [GamePhase.BATTLE_RESOLUTION]: {
    label: '전투 해결',
    bg: 'bg-yellow-950',
    text: 'text-yellow-400',
    border: 'border-yellow-500',
  },
  [GamePhase.GAME_OVER]: {
    label: '게임 종료',
    bg: 'bg-yellow-950',
    text: 'text-selected',
    border: 'border-selected',
  },
};

export function TurnIndicator() {
  const turn = useGameStore(s => s.turn);
  const maxTurns = useGameStore(s => s.maxTurns);
  const phase = useGameStore(s => s.phase);

  const config = PHASE_CONFIG[phase];

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${config.bg} ${config.border}`}>
      <span className="text-sm text-gray-400">
        턴 <span className="text-white font-bold">{turn}</span>
        <span className="text-gray-500">/{maxTurns}</span>
      </span>
      <span className={`text-sm font-semibold ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
}
