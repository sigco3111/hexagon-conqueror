import { useMapStore } from '@/stores/mapStore';
import { Owner } from '@/types/game';

interface GameOverOverlayProps {
  winner: Owner;
  onRestart: () => void;
}

export function GameOverOverlay({ winner, onRestart }: GameOverOverlayProps) {
  const cells = useMapStore((s) => s.cells);
  const allCells = Object.values(cells);
  const playerCells = allCells.filter((c) => c.owner === Owner.PLAYER).length;
  const aiCells = allCells.filter((c) => c.owner === Owner.AI).length;
  const totalCells = allCells.length;

  const isVictory = winner === Owner.PLAYER;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="max-w-sm w-full mx-4 p-6 rounded-xl bg-gray-900 border border-gray-700 text-center space-y-5">
        <div className="space-y-2">
          <div className="text-5xl">{isVictory ? '🏆' : '💀'}</div>
          <h2
            className={`text-2xl font-bold ${
              isVictory ? 'text-yellow-400' : 'text-red-400'
            }`}
          >
            {isVictory ? '전국 통일!' : '패배...'}
          </h2>
          <p className="text-sm text-gray-400">
            {isVictory
              ? '모든 영토를 정복했습니다!'
              : 'AI에게 모든 영토를 빼앗겼습니다.'}
          </p>
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-player">{playerCells}</div>
            <div className="text-gray-500 text-xs">플레이어</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{totalCells}</div>
            <div className="text-gray-500 text-xs">전체 셀</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-ai">{aiCells}</div>
            <div className="text-gray-500 text-xs">AI</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer"
        >
          다시 시작
        </button>
      </div>
    </div>
  );
}
