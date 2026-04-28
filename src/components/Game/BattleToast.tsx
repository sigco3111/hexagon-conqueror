import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { Owner } from '@/types/game';

export function BattleToast() {
  const lastBattleResult = useGameStore(s => s.lastBattleResult);
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState(lastBattleResult);

  useEffect(() => {
    if (lastBattleResult) {
      setResult(lastBattleResult);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        useGameStore.getState().setLastBattleResult(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [lastBattleResult]);

  if (!visible || !result) return null;

  const isPlayer = result.attackerOwner === Owner.PLAYER;
  const isSuccess = result.success;

  const bgColor = isSuccess
    ? isPlayer ? 'bg-green-900/90 border-green-500/50' : 'bg-red-900/90 border-red-500/50'
    : 'bg-gray-800/90 border-gray-600/50';

  const icon = isSuccess
    ? isPlayer ? '✅' : '⚠️'
    : '❌';

  const title = isPlayer
    ? isSuccess ? '점령 성공!' : '점령 실패'
    : isSuccess ? 'AI 점령 성공!' : 'AI 점령 실패';

  return (
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce-once`}>
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${bgColor} backdrop-blur-sm shadow-2xl`}>
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-sm font-bold text-white">{title}</div>
          <div className="text-xs text-gray-300 mt-0.5">
            공격 <span className="font-mono text-yellow-400">{result.attackPower.toFixed(1)}</span>
            {' vs '}
            방어 <span className="font-mono text-red-400">{result.defensePower.toFixed(1)}</span>
            <span className="text-gray-500 ml-1.5">🎲 {result.diceRoll}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
