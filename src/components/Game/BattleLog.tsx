import { useEffect, useMemo, useRef, useState } from 'react';
import { useBattleStore } from '@/stores/battleStore';
import { Owner } from '@/types/game';
import type { BattleResult } from '@/types/game';

function BattleEntry({ result, isNew }: { result: BattleResult; isNew: boolean }) {
  const isPlayer = result.attackerOwner === Owner.PLAYER;
  const isSuccess = result.success;

  const icon = isSuccess
    ? isPlayer ? '✅' : '⚠️'
    : '❌';
  const statusText = isSuccess ? '성공' : '실패';
  const statusColor = isSuccess
    ? isPlayer ? 'text-green-400' : 'text-red-400'
    : 'text-gray-500';

  const attackerLabel = isPlayer ? '플레이어' : 'AI';

  return (
    <div className={`py-2 transition-opacity ${isNew ? '' : 'opacity-60'}`}>
      <div className={`text-sm font-medium ${isSuccess ? (isPlayer ? 'text-green-400' : 'text-red-400') : 'text-gray-500'}`}>
        {icon} {attackerLabel} → {result.defenderCellId.slice(0, 8)} ({statusText})
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        공격력: <span className="font-mono">{result.attackPower.toFixed(1)}</span>
        {' vs '}
        방어력: <span className="font-mono">{result.defensePower.toFixed(1)}</span>
      </div>
      <div className={`text-xs mt-0.5 ${statusColor}`}>
        🎲 주사위: {result.diceRoll}
      </div>
    </div>
  );
}

export function BattleLog() {
  const battleLog = useBattleStore(s => s.battleLog);
  const battles = useMemo(() => battleLog.slice(-20).reverse(), [battleLog]);
  const [prevCount, setPrevCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const newCount = Math.max(0, battleLog.length - prevCount);
  useEffect(() => {
    setPrevCount(battleLog.length);
  }, [battleLog.length]);

  return (
    <div className="flex flex-col rounded-lg bg-gray-800 border border-gray-700 overflow-hidden h-full">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-2">
          <span role="img" aria-label="전투 기록">📜</span>
          <span className="text-sm font-semibold text-gray-300">전투 기록</span>
        </div>
        <span className="text-[10px] text-gray-500">최신 ↑</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 divide-y divide-gray-700/50"
      >
        {battles.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            아직 전투 기록이 없습니다
          </div>
        ) : (
          battles.map((result, index) => (
            <BattleEntry
              key={`${result.timestamp}-${index}`}
              result={result}
              isNew={index < newCount}
            />
          ))
        )}
      </div>
    </div>
  );
}
