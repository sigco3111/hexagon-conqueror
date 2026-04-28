interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sections = [
  {
    title: '🎮 기본 조작',
    items: [
      '인접한 적/중립 셀을 클릭하여 영토를 확장하세요',
      '먼저 내 셀(파랑)을 선택한 후, 공격할 셀을 클릭하세요',
      '⚔️ 공격 버튼으로 전투를 시작합니다',
    ],
  },
  {
    title: '📊 셀 속성',
    items: [
      '🏰 방어력: 셀의 수비 수치. 높을수록 점령 어려움',
      '👥 인구: 공격력에 영향을 줍니다 (인구/10)',
      '💎 자원: 행동력 보너스, 방어 강화, 공격력 보너스에 사용',
    ],
  },
  {
    title: '⚔️ 전투 시스템',
    items: [
      '공격력 = (AP + 인구/10 + 자원/20) × (1 + 연속승 × 0.1)',
      '방어력 = 셀 방어력 + 주사위(1~6)',
      '공격력 > 방어력 → 점령 성공!',
    ],
  },
  {
    title: '💎 자원 활용',
    items: [
      '행동력 보너스: 보유 자원 50당 +1 AP',
      '점령 시 방어 보너스: 셀 자원 20당 +1 방어력 (자원 소모 없음)',
      '방어 강화: 자원 20 + AP 1 → 방어력 +1 (턴당 1회)',
    ],
  },
  {
    title: '🏆 승리 조건',
    items: [
      '모든 셀을 점령하면 승리!',
      '상대방의 마지막 셀을 빼앗아도 승리!',
      '100턴 초과 시 더 많은 셀을 보유한 쪽이 승리',
    ],
  },
  {
    title: '🤖 AI 자동 플레이',
    items: [
      '🤖 버튼으로 플레이어 자동 플레이 토글',
      '셀 클릭 시 자동 해제됩니다',
    ],
  },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl border border-gray-600 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
          <h2 className="text-lg font-bold text-white">
            🎯 헥사곤 정복자 — 게임 방법
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm text-gray-300 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gray-500"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-2 sticky bottom-0 bg-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
