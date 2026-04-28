import { useGameStore } from '@/stores/gameStore';
import { useGame } from '@/hooks/useGame';
import { GamePhase } from '@/types/game';
import { AutoPlayToggle } from '@/components/UI/AutoPlayToggle';

export function ActionMenu() {
  const phase = useGameStore(s => s.phase);
  const targetCellId = useGameStore(s => s.targetCellId);
  const actionPoints = useGameStore(s => s.actionPoints);
  const { executeAttack, endPlayerTurn, fortifyCell } = useGame();

  const isPlayerTurn = phase === GamePhase.PLAYER_TURN;
  const canAttack = isPlayerTurn && targetCellId !== null && actionPoints > 0;

  const hasFortified = useGameStore(s => s.hasFortified);
  const selectedCellId = useGameStore(s => s.selectedCellId);
  const canFortify = isPlayerTurn && !hasFortified && selectedCellId !== null && actionPoints > 0;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900/90 border border-gray-700 backdrop-blur-sm">
      <AutoPlayToggle />
      <div className="w-px h-6 bg-gray-600" />
      <button
        onClick={fortifyCell}
        disabled={!canFortify}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          canFortify
            ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title={hasFortified ? '이번 턴에 이미 강화했습니다' : '20 자원 소모 → 방어력 +1'}
      >
        <span>🏰</span>
        방어 강화
      </button>
      <div className="w-px h-6 bg-gray-600" />
      <button
        onClick={executeAttack}
        disabled={!canAttack}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          canAttack
            ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <span role="img" aria-label="공격">⚔️</span>
        공격
      </button>

      <button
        onClick={endPlayerTurn}
        disabled={!isPlayerTurn}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          isPlayerTurn
            ? 'bg-gray-600 hover:bg-gray-500 text-white cursor-pointer'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        <span role="img" aria-label="턴 종료">⏭️</span>
        턴 종료
      </button>
    </div>
  );
}
