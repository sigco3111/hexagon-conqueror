import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { Owner } from '@/types/game';

export function ResourceBar() {
  const actionPoints = useGameStore(s => s.actionPoints);
  const cells = useMapStore(s => s.cells);

  const allCells = Object.values(cells);
  const playerCellCount = allCells.filter(c => c.owner === Owner.PLAYER).length;
  const totalResources = allCells
    .filter(c => c.owner === Owner.PLAYER)
    .reduce((sum, c) => sum + c.resources, 0);

  const isLowAP = actionPoints <= 1;

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700">
      <div className="flex items-center gap-1.5">
        <span className="text-sm" role="img" aria-label="행동력">⚡</span>
        <span className={`text-sm font-bold ${isLowAP ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {actionPoints}
        </span>
        <span className="text-xs text-gray-500">AP</span>
      </div>

      <div className="w-px h-4 bg-gray-600" />

      <div className="flex items-center gap-1.5">
        <span className="text-sm" role="img" aria-label="영토">🗺️</span>
        <span className="text-sm font-bold text-white">
          {playerCellCount}
        </span>
        <span className="text-xs text-gray-500">셀</span>
      </div>

      <div className="w-px h-4 bg-gray-600" />

      <div className="flex items-center gap-1.5">
        <span className="text-sm" role="img" aria-label="자원">💎</span>
        <span className="text-sm font-bold text-white">
          {totalResources}
        </span>
        <span className="text-xs text-gray-500">자원</span>
      </div>
    </div>
  );
}
