import { useGameStore } from '@/stores/gameStore';
import { useMapStore } from '@/stores/mapStore';
import { Owner } from '@/types/game';
import { calculateAttackPower, calculateDefensePower } from '@/utils/battleCalc';

const OWNER_LABELS: Record<Owner, { icon: string; label: string; color: string }> = {
  [Owner.PLAYER]: { icon: '🟦', label: '플레이어', color: 'text-player' },
  [Owner.AI]: { icon: '🟥', label: 'AI', color: 'text-ai' },
  [Owner.NEUTRAL]: { icon: '⬜', label: '중립', color: 'text-neutral' },
};

const MAX_STAT = 10;

function StatBar({ label, value, max = MAX_STAT }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-12 shrink-0 text-gray-400">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-300">{value}</span>
    </div>
  );
}

function AttackPrediction({
  selectedOwner,
  targetOwner,
  attackPower,
  minDefense,
  maxDefense,
  winChance,
}: {
  selectedOwner: Owner;
  targetOwner: Owner;
  attackPower: number;
  minDefense: number;
  maxDefense: number;
  winChance: number;
}) {
  const attackerLabel = OWNER_LABELS[selectedOwner];
  const defenderLabel = OWNER_LABELS[targetOwner];

  return (
    <div className="mt-3 pt-3 border-t border-gray-700">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        공격 예상
      </h3>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">공격력 ({attackerLabel.icon})</span>
          <span className="text-yellow-400 font-mono">{attackPower.toFixed(1)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">방어력 ({defenderLabel.icon})</span>
          <span className="text-red-400 font-mono">
            {minDefense}~{maxDefense}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">승률</span>
          <span className={`font-mono ${winChance >= 60 ? 'text-green-400' : winChance >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            약 {Math.round(winChance)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function CellInfo() {
  const selectedCellId = useGameStore((s) => s.selectedCellId);
  const targetCellId = useGameStore((s) => s.targetCellId);
  const actionPoints = useGameStore((s) => s.actionPoints);
  const consecutiveWins = useGameStore((s) => s.consecutiveWins);
  const hasFortified = useGameStore((s) => s.hasFortified);
  const getCell = useMapStore((s) => s.getCell);

  if (!selectedCellId) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-gray-500 text-sm">
        셀을 클릭하세요
      </div>
    );
  }

  const selectedCell = getCell(selectedCellId);
  if (!selectedCell) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-gray-500 text-sm">
        셀을 클릭하세요
      </div>
    );
  }

  const ownerInfo = OWNER_LABELS[selectedCell.owner];
  const targetCell = targetCellId ? getCell(targetCellId) : null;

  let prediction: React.ReactNode = null;
  if (targetCell && selectedCell.owner === Owner.PLAYER) {
    const attackPower = calculateAttackPower(
      actionPoints,
      selectedCell.population,
      consecutiveWins,
      selectedCell.resources,
    );
    const minDefense = calculateDefensePower(targetCell.defense, 1);
    const maxDefense = calculateDefensePower(targetCell.defense, 6);
    const winChance =
      ((attackPower - minDefense) / (maxDefense - minDefense + 1)) * 100;
    const clampedWin = Math.max(0, Math.min(100, winChance));

    prediction = (
      <AttackPrediction
        selectedOwner={selectedCell.owner}
        targetOwner={targetCell.owner}
        attackPower={attackPower}
        minDefense={minDefense}
        maxDefense={maxDefense}
        winChance={clampedWin}
      />
    );
  }

  return (
    <div className="p-4 space-y-3 text-gray-200">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
        선택 영토 정보
      </h2>

      <div className="flex items-center gap-2">
        <span>{ownerInfo.icon}</span>
        <span className={`text-sm font-medium ${ownerInfo.color}`}>
          {ownerInfo.label}
        </span>
        {selectedCell.region && (
          <span className="text-xs text-gray-500 ml-auto">
            {selectedCell.region}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <StatBar label="방어력" value={selectedCell.defense} />
        <StatBar label="인구" value={selectedCell.population} max={100} />
        <StatBar label="자원" value={selectedCell.resources} max={100} />
      </div>

      {targetCell && (
        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">타겟:</span>
            <span>{OWNER_LABELS[targetCell.owner].icon}</span>
            <span className="text-red-400 font-medium">
              {OWNER_LABELS[targetCell.owner].label}
            </span>
          </div>
          <div className="space-y-1.5 mt-2">
            <StatBar label="방어력" value={targetCell.defense} />
            <StatBar label="인구" value={targetCell.population} max={100} />
          </div>
        </div>
      )}

      {prediction}

      {selectedCell.owner === Owner.PLAYER && !hasFortified && selectedCell.resources >= 20 && (
        <div className="mt-2 px-2 py-1.5 rounded bg-amber-900/30 border border-amber-700/30 text-xs text-amber-400">
          🏰 방어 강화 가능 (💎20 → 🛡️+1)
        </div>
      )}
    </div>
  );
}
