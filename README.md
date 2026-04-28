# 🎯 헥사곤 정복자 (Hexagon Conqueror)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sigco3111/hexagon-conqueror)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Play%20Now-ff6b6b?style=for-the-badge)](https://hexagon-conqueror.vercel.app)

> 실제 한국 지도 위에서 펼치는 영토 확장 리스크 게임

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

## 📋 프로젝트 개요

**헥사곤 정복자**는 실제 한국 지도 기반의 턴제 전략 리스크 게임입니다. H3 헥스 그리드(Resolution 5)로 한국 지도를 약 812개 셀로 분할하며, 각 셀이 하나의 영토가 됩니다.

플레이어는 랜덤 위치에서 시작하여 인접 영토를 하나씩 점령하며 세력을 확장합니다. 각 셀은 **인구**, **자원**, **방어력**의 고유 속성을 가지며, 자원을 활용한 전략적 판단이 승패를 좌우합니다.

**목표: 전국 통일**

---

## 🎮 게임 방법

### 핵심 메커니즘

| 요소 | 설명 |
|------|------|
| **턴제 점령** | 매 턴 행동력(AP)을 소모하여 인접 적/중립 셀 공격 |
| **전투 시스템** | 공격력 vs 방어력 + 주사위 요소로 승패 결정 |
| **자원 관리** | AP 보너스, 방어 강화, 공격력 보너스에 활용 |
| **영토 확장** | 연속 승리 시 공격력 보너스 누적 |

### 셀 속성

- **🏰 방어력 (Defense)**: 셀 고유의 수비 수치. 높을수록 점령 어려움
- **👥 인구 (Population)**: 공격력에 영향 (인구/10)
- **💎 자원 (Resource)**: AP 보너스, 점령 시 방어 보너스, 방어 강화, 공격력 보너스에 사용

### 전투 공식

```
공격력 = (AP + 인구/10 + 자원/20) × (1 + 연속승 × 0.1)
방어력 = 셀 방어력 + 주사위(1~6)
결과   = 공격력 > 방어력 → 점령 성공
```

### 행동력(AP) 공식

```
AP = 기본(3) + floor(보유셀수/10) + floor(총자원/50)
```

### 자원 활용

| 용도 | 효과 | 비고 |
|------|------|------|
| AP 보너스 | 보유 자원 50당 +1 AP | 매 턴 시작 시 자동 적용 |
| 점령 시 방어 보너스 | 셀 자원 20당 +1 방어력 | 자원 소모 없음 |
| 방어 강화 | 자원 20 + AP 1 → 방어력 +1 | 턴당 1회, 내 셀에만 |
| 공격력 보너스 | 선택 셀 자원 20당 +1 공격력 | 자동 적용 |

### AI 상대

- **Easy / Normal / Hard** 3단계 난이도
- Easy: 무작위 행동
- Normal: 약한 타겟 우선 공격
- Hard: 미니맥스 알고리즘 기반 턴 예측 시뮬레이션
- 🤖 자동 플레이 토글로 플레이어 턴 자동 진행 가능

### 승리 조건

- **플레이어 승리**: 모든 셀 점령
- **AI 승리**: 플레이어의 마지막 셀 점령
- **무승부**: 100턴 초과 시 더 많은 셀을 보유한 쪽이 승리

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 한국 지도 기반 | H3 Resolution 5로 생성한 812개 헥스 셀 (남한 전체) |
| 실시간 지도 렌더링 | MapLibre GL JS + deck.gl GeoJsonLayer |
| 3단계 AI | Easy/Normal/Hard + 미니맥스 |
| 자원 시스템 | AP 보너스, 방어 강화, 점령 보너스, 공격력 보너스 |
| 전투 피드백 | BattleToast (공격/방어력, 주사위 결과, 승패) |
| 전투 기록 | 최신순 정렬, 새 항목 하이라이트 |
| 자동 플레이 | 🤖 토글로 플레이어 턴 자동 진행 |
| 자동 저장 | localStorage에 게임 상태 자동 저장, 이어하기 지원 |
| 도움말 | 게임 시작 시 자동 표시, ❓ 버튼으로 언제든 확인 |

---

## 🛠️ 기술 스택

```
Frontend Framework   React 18 + TypeScript (strict mode)
Map Rendering       MapLibre GL JS v4
Hexagon Layer       deck.gl GeoJsonLayer
State Management    Zustand v5
Styling             Tailwind CSS
Build Tool          Vite
Testing             Vitest + React Testing Library
Maps                OpenStreetMap / CARTO 타일
Hex Grid            h3-js v4 (H3 Resolution 5)
```

### 아키텍처

```
src/
├── components/
│   ├── Map/
│   │   ├── GameMap.tsx            # MapLibre + deck.gl 통합 지도
│   │   └── HexagonLayer.tsx       # GeoJsonLayer 래퍼 (셀 색상/높이/클릭)
│   ├── Game/
│   │   ├── GameBoard.tsx          # 메인 게임 보드 (HUD + 자동저장 + 도움말)
│   │   ├── StartScreen.tsx        # 시작 화면 (난이도 선택 + 이어하기)
│   │   ├── GameOverOverlay.tsx    # 게임 종료 오버레이
│   │   ├── CellInfo.tsx           # 선택 셀 정보 패널
│   │   ├── BattleLog.tsx          # 전투 기록 (최신순)
│   │   ├── BattleToast.tsx        # 전투 결과 토스트 알림
│   │   └── HelpModal.tsx          # 도움말 모달
│   └── UI/
│       ├── TurnIndicator.tsx      # 턴/페이즈 표시
│       ├── ResourceBar.tsx        # AP/영토/자원 표시
│       ├── ActionMenu.tsx         # 자동플레이 + 방어강화 + 공격 + 턴종료
│       └── AutoPlayToggle.tsx     # 🤖 자동 플레이 토글 버튼
├── stores/
│   ├── gameStore.ts               # 게임 상태 (phase, turn, AP, autoPlay 등)
│   ├── mapStore.ts                # 셀 데이터 (812셀, 소유권, 자원 수정)
│   └── battleStore.ts             # 전투 기록
├── hooks/
│   ├── useGame.ts                 # 핵심 게임 로직 (초기화, 공격, 요새화)
│   ├── useAI.ts                   # AI 턴 실행
│   ├── useAutoPlay.ts             # 인터럽트 가능한 자동 플레이 루프
│   └── useAutoSave.ts             # localStorage 자동 저장 (500ms 디바운스)
├── utils/
│   ├── geoUtils.ts                # H3 그리드 생성, GeoJSON 변환
│   ├── battleCalc.ts              # 전투 계산 (주사위, 공격력, 방어력)
│   ├── aiStrategy.ts              # AI 전략 (Easy/Normal/Hard + 미니맥스)
│   └── gameSave.ts                # 게임 저장/로드/복원 (localStorage)
├── types/
│   └── game.ts                    # 타입 정의
├── data/
│   └── koreaHexGrid.json          # 한국 지도 H3 그리드 (812셀, 사전 생성)
└── test/
    └── setup.ts                   # 테스트 설정
```

---

## 🚀 시작하기

### 필수 조건

- Node.js 18+
- npm

### 설치

```bash
git clone https://github.com/sigco3111/hexagon-conqueror.git
cd hexagon-conqueror
npm install
npm run dev
```

### 빌드

```bash
npm run build
```

### 테스트

```bash
npm test
```

---

## 📊 개발 로드맵

| 단계 | 내용 | 상태 |
|------|------|------|
| v0.1 | 프로젝트 셋업, deck.gl + MapLibre 연동 | ✅ 완료 |
| v0.2 | 한국 지도 H3 헥스 그리드 생성 (812셀) | ✅ 완료 |
| v0.3 | 게임 상태 관리 (Zustand v5) | ✅ 완료 |
| v0.4 | 턴제 점령 시스템 구현 | ✅ 완료 |
| v0.5 | 전투 시스템 + 주사위 로직 | ✅ 완료 |
| v0.6 | Easy/Normal/Hard AI 구현 | ✅ 완료 |
| v0.7 | UI/UX 개선 + 전투 로그 + BattleToast | ✅ 완료 |
| v0.8 | 자원 시스템 (AP 보너스, 방어 강화, 공격력 보너스) | ✅ 완료 |
| v0.9 | AI 자동 플레이 토글 | ✅ 완료 |
| v1.0 | 자동 저장 + 이어하기 + 도움말 모달 | ✅ 완료 |

---

## 🎮 데모 플레이

**👉 [헥사곤 정복자 플레이하기](https://hexagon-conqueror.vercel.app)**

---

## 🤝 기여

버그 리포트 및 기능 요청은 [Issues](https://github.com/sigco3111/hexagon-conqueror/issues)에 등록해 주세요.

---

## 📜 라이선스

MIT License — 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🔗 관련 링크

- [deck.gl Documentation](https://deck.gl/docs)
- [MapLibre GL JS](https://maplibre.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [h3-js](https://github.com/uber/h3-js)
- [리스크 (보드 게임)](https://en.wikipedia.org/wiki/Risk_(board_game))
