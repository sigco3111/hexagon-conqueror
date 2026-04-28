import { useState } from 'react';
import { Difficulty } from '@/types/game';
import { hasSavedGame } from '@/utils/gameSave';

interface StartScreenProps {
  onStart: (difficulty: Difficulty) => void;
  onResume?: () => void;
}

const DIFFICULTY_OPTIONS: Array<{
  value: Difficulty;
  label: string;
  description: string;
  icon: string;
}> = [
  { value: Difficulty.EASY, label: '쉬움', description: 'AI가 무작위로 행동합니다', icon: '🟢' },
  { value: Difficulty.NORMAL, label: '보통', description: 'AI가 약한 타겟을 우선 공격합니다', icon: '🟡' },
  { value: Difficulty.HARD, label: '어려움', description: 'AI가 미니맥스 알고리즘을 사용합니다', icon: '🔴' },
];

const RULES = [
  '인접한 적/중립 셀을 클릭하여 영토를 확장하세요',
  '전투는 주사위 결과에 따라 승패가 결정됩니다',
  '모든 셀을 점령하면 승리합니다',
  '매 턴 행동력(AP)을 소모하여 공격할 수 있습니다',
];

export function StartScreen({ onStart, onResume }: StartScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const canResume = hasSavedGame() && !!onResume;

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            🎯 헥사곤 정복자
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            실제 한국 지도 위에서 펼쳐지는 영토 확장 리스크 게임.
            <br />
            AI를 상대로 전국을 통일하세요!
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            난이도 선택
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 transition-all ${
                  difficulty === opt.value
                    ? 'border-selected bg-selected/10 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center">
            {DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.description}
          </p>
        </div>

        <div className="space-y-2">
          {canResume && (
            <button
              onClick={onResume}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg transition-colors cursor-pointer"
            >
              이어하기
            </button>
          )}
          <button
            onClick={() => onStart(difficulty)}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-colors cursor-pointer"
          >
            게임 시작
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            게임 규칙
          </h3>
          <ul className="space-y-1.5">
            {RULES.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="text-gray-600 mt-0.5">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
