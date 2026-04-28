import { useGameStore } from '@/stores/gameStore';
import { GamePhase } from '@/types/game';

export function AutoPlayToggle() {
  const autoPlay = useGameStore(s => s.autoPlay);
  const phase = useGameStore(s => s.phase);
  const toggleAutoPlay = useGameStore(s => s.toggleAutoPlay);

  const isPlayerTurn = phase === GamePhase.PLAYER_TURN;
  const disabled = !isPlayerTurn;

  return (
    <button
      onClick={toggleAutoPlay}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
        disabled
          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
          : autoPlay
            ? 'bg-green-600 hover:bg-green-500 text-white ring-2 ring-green-400/50 cursor-pointer'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300 cursor-pointer'
      }`}
      title={autoPlay ? '클릭하여 수동 조작으로 전환' : '클릭하여 AI에게 턴 위임'}
    >
      <span>🤖</span>
      {autoPlay ? '자동 플레이 중...' : '자동 플레이'}
    </button>
  );
}
