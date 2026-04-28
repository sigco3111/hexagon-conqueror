# 🎯 헥사곤 정복자 (Hexagon Conqueror)

> 실제 한국 지도 위에서 펼치는 영토 확장 리스크 게임

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## 📋 프로젝트 개요

**헥사곤 정복자**는 실제 한국 지도 기반의 턴제 전략 리스크 게임입니다. 지도 위의 영역을 정밀한 **HexagonLayer**(육각형 셀) 단위로 분할하여, 각 셀이 하나의 영토가 됩니다.

플레이어는自己的人 Emergent Strategist로 시작하여, 인접 영토를 하나씩 점령하며 세력을 확장합니다. 각 셀은 **인구**, **자원**, **방어력**의 고유 속성을 가지며, 이를 활용한 전략적 판단이 승패를 좌우합니다.

**목표: 전국 통일**

---

## 🎮 게임玩法

### 핵심 메커니즘

| 요소 | 설명 |
|------|------|
| **턴제 점령** | 매 턴 인접한 적/중립 셀 1개 점령 가능 |
| **세포다지** | 점령 전 AI 방어력 굴림 → 승패 결정 |
| **자원 관리** | 셀 점령 시 자원 소모, 방어력 보너스 획득 |
| **영토 확장** | 연속 점령으로 보너스, 실컷하면 공세 정체 |

### 셀 속성

- **🏰 방어력 (Defense)**: 셀 고유의 수비 수치. 높을수록 점령 어려움
- **👥 인구 (Population)**: 클수록 전략적 가치 + 점령 시 보너스
- **⚡ 자원 (Resource)**: 포인트로 전환되어 추가 행동력 획득

### AI 상대

- **Easy / Normal / Hard** 3단계 난이도
- 각 난이도마다 탐욕(greed) 알고리즘 레벨 차등 적용
- Hard 모드: 미니맥스 알고리즘 기반 턴 예측 시뮬레이션

---

## 🛠️ 기술 스택

```
Frontend Framework   React 18 + TypeScript
Map Rendering       MapLibre GL JS
Hexagon Layer       deck.gl HexagonLayer
State Management    Zustand
Styling             Tailwind CSS
Build Tool          Vite
Maps                OpenStreetMap / 한국 지형도 타일
```

### 아키텍처

```
src/
├── components/          # UI 컴포넌트
│   ├── Map/
│   │   ├── GameMap.tsx        # deck.gl + MapLibre 통합 지도
│   │   └── HexagonLayer.tsx   # HexagonLayer 래퍼
│   ├── Game/
│   │   ├── GameBoard.tsx      # 게임 보드 (HUD 포함)
│   │   ├── CellInfo.tsx       # 선택 셀 정보 패널
│   │   └── BattleLog.tsx      # 전투 로그
│   └── UI/
│       ├── TurnIndicator.tsx  # 턴 표시
│       ├── ResourceBar.tsx    # 자원 바
│       └── ActionMenu.tsx     # 행동 메뉴
├── stores/
│   ├── gameStore.ts     # 게임 상태 (Zustand)
│   ├── mapStore.ts      # 지도/셀 상태
│   └── battleStore.ts   # 전투/AI 상태
├── hooks/
│   ├── useGame.ts       # 게임 로직 훅
│   ├── useHexagon.ts    # HexagonLayer 커스텀 훅
│   └── useAI.ts         # AI 로직 훅
├── utils/
│   ├── geoUtils.ts      # GeoJSON/헥사곤 유틸
│   ├── battleCalc.ts    # 전투 계산
│   └── aiStrategy.ts    # AI 전략 알고리즘
├── types/
│   └── game.ts          # 타입 정의
└── data/
    └── koreaHexGrid.json  # 한국 지도 Hexagon 그리드 데이터
```

---

## 🎯 HexagonLayer가 곧 게임 보드

deck.gl의 `HexagonLayer`는 단순한 데이터 시각화를 넘어 **게임 보드**로 재정의됩니다:

1. **한국 지도 전체를 Hexagon 셀로 분할** — 지도 위에 정밀한 전략 그리드 생성
2. **셀 색상 = 세력 색상** — 소유권이 곧 보드 상태
3. **셀 높이 = 방어력** — 3D로 표현되는 전략적 요충지
4. **셀 크기 = 인구** — 큰 셀일수록 중요한 거점

```
┌─────────────────────────────────────────────┐
│                                             │
│     🟦 플레이어   🟥 AI   ⬜ 중립   🟫 점령가능  │
│                                             │
│           ┌───┐                             │
│          /     \     ← HexagonLayer Cell   │
│         │  서울  │                           │
│          \     /                             │
│           └───┘                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🚀 시작하기

### 필수 조건

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/sigco3111/hexagon-conqueror.git
cd hexagon-conqueror

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
npm run build
```

---

## 🎮 게임 규칙 요약

### 기본 흐름

1. **게임 시작**: 플레이어(파랑) 1셀, AI(빨강) 1셀, 중립 셀 다수
2. **턴 시작**: 사용 가능한 행동력 확인
3. **셀 선택**: 인접한 적/중립 셀 클릭
4. **전투**: 주사위 굴림 → 방어력 보정 → 승패 결정
5. **점령**: 승리 시 셀 소유권 이전
6. **턴 종료**: 행동력 소진 또는 직접 종료
7. **AI 턴**: AI가 동일한流程으로 행동
8. **반복**: 전국 통일(모든 셀 점령)까지

### 전투 공식

```
공격력 = (행동력 + 인구/10) × (1 + 연속승보너스)
방어력 = 셀 방어력 + 주사위 결과
결과 = 공격력 > 방어력 → 점령 성공
```

### 승리 조건

- **플레이어 승리**: 모든 셀 점령
- **AI 승리**: 플레이어의 마지막 셀 점령
- **무승부**: 100턴 초과 시 점령 셀 수 비교

---

## 📊 개발 로드맵

| 단계 | 내용 | 상태 |
|------|------|------|
| v0.1 | 프로젝트 셋업, deck.gl + MapLibre 연동 | 📋 계획 |
| v0.2 | 한국 지도 Hexagon 그리드 생성 | 📋 계획 |
| v0.3 | 기본 게임 상태 관리 (Zustand) | 📋 계획 |
| v0.4 | 턴제 점령 시스템 구현 | 📋 계획 |
| v0.5 | 전투 시스템 + 주사위 로직 | 📋 계획 |
| v0.6 | Easy/Normal AI 상대 구현 | 📋 계획 |
| v0.7 | Hard AI (미니맥스) 구현 | 📋 계획 |
| v0.8 | UI/UX 개선 + 전투 로그 | 📋 계획 |
| v1.0 | 전체 기능 통합 + 버그 수정 | 📋 계획 |

---

## 🤝 기여指南

버그 리포트 및 기능 요청은 [Issues](https://github.com/sigco3111/hexagon-conqueror/issues)에 등록해 주세요.

---

## 📜 라이선스

MIT License — 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🔗 관련 링크

- [deck.gl Documentation](https://deck.gl/docs)
- [MapLibre GL JS](https://maplibre.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [리스크 ( board game)](https://en.wikipedia.org/wiki/Risk_(board_game))
