# 하루1소재 - 프로젝트 진행 현황

## 프로젝트 개요

메이플스토리 경험치 효율 계산기. 소재별 가성비를 비교하고, 각 경험치 콘텐츠의 레벨별 획득량을 한눈에 확인할 수 있는 웹 앱.

- **URL**: 로컬 개발 환경 (배포 미정)
- **스택**: Next.js App Router, TypeScript, Tailwind CSS v4
- **라우팅**: `[[...slug]]` catch-all 라우트 하나로 전체 처리

---

## 현재 구현된 기능

### 메인탭 (소재비)

캐릭터 슬롯 4개, 각 슬롯에 캐릭터를 등록하면:
- 오늘 경험치% 1분 폴링 (`maple-char-${ocid}` 키에 캐시)
- 캐릭터 이미지, 직업, 길드, 월드 표시
- 보약 수치(몬파/에픽/트레져)를 캐릭 스킬 API에서 자동 파싱
- CharacterCard에서 `onTodayLoaded` 콜백으로 page.tsx에 경험치% 전달

경험치% 로드 흐름:
1. 앱 마운트 시 `maple-char-${ocid}`에서 오늘 데이터 읽어 `todayExpRate` 복원
2. CharacterCard 마운트 후 캐시 → `onTodayLoaded` → `setTodayExpRate`
3. `todayExpRate` 변경 시 모든 시뮬레이터 입력란에 자동 반영

소재비 계산 항목:
- 30분 도핑: 황금태엽, VIP, 헥사, 영겁
- 30일 도핑: 추경50%, 70%, 2배/3배/4배 쿠폰, 소경축비, 고농축비, 아즈모스, 사냥칭호, 혈반, 부스트링, 정펜
- BM: 몬파, VIP 사우나, 슈퍼쿠폰
- 순위는 효율(경험치/메소) 기준

### 경험치 콘텐츠탭

URL 유지: 탭 전환 시 `/cont/{key}`로 `replaceState`, 새로고침 시 해당 탭으로 복원

| 탭 | 주요 기능 |
|---|---|
| 에픽 던전 | 3개 구간(하이마운틴/앵컴/악몽선경) 레벨별 경험치, 단계별 메포 표시, 보약 반영, 시뮬레이터 |
| 몬스터파크 | 구간별 경험치, 썬데이/스페셜 배율, 보약, 시뮬레이터 |
| 트레져 헌터 | 골드/다이아 박스(폴로·프리토, 에스페시아) 등급별 경험치, 썬데이, 보약 |
| 블루베리 농장 | 레벨별 경험치, 시뮬레이터 |
| VIP 사우나 | 레벨별 경험치, 시간/목표 시뮬레이터 |
| 슈퍼경험치 쿠폰 | 레벨별 경험치, 개수/목표 시뮬레이터 |
| 메카베리 농장 | 레벨별 경험치, 개수/목표 시뮬레이터 |

공통: 현재 캐릭터 레벨/"나" 행 자동 스크롤, 카드 높이 664px(에픽던전/트레져), 짧은 콘텐츠는 내용 길이대로

### 사냥터 탭 / 경험치 정보 탭 / 정보센터 탭

- 사냥터: 지역·사냥터 선택, 몹 구성 편집
- 경험치 정보: 레벨별 필요 경험치, 단순 조회용
- 정보센터: 업데이트 내역 + 도움말, 탭 버튼 우측 정렬

---

## 데이터 파일

| 파일 | 내용 |
|---|---|
| `data/epicDungeon.ts` | 에픽 던전 구간별 레벨·경험치·메포 |
| `data/monsterPark.ts` | 몬스터파크 구간별 기본 경험치 |
| `data/treasureHunter.ts` | 트레져 헌터 박스별 등급 배율 |
| `data/vipSauna.ts` | VIP 사우나 레벨별 경험치 |
| `data/superExpCoupon.ts` | 슈퍼경험치 쿠폰 레벨별 경험치 |
| `data/mekaberry.ts` | 메카베리 레벨별 경험치 |
| `data/blueberry.ts` | 블루베리 레벨별 경험치 |
| `data/levelExp.ts` | 레벨별 필요 경험치 (260~300) |
| `data/monsterExp.ts` | 몬스터 레벨별 경험치 |
| `data/huntingGrounds.ts` | 지역·사냥터 목록 |
| `data/classRanking.ts` | 직업 랭킹 기준 데이터 |

---

## API 라우트

| 경로 | 역할 |
|---|---|
| `/api/character` | nexon API로 캐릭터 기본정보 + ocid 조회 |
| `/api/character/history` | 경험치 히스토리 (최근 7일) |
| `/api/character/ranking` | 직업 랭킹 조회 |
| `/api/character/skill` | 스킬 조회 → 보약 수치 파싱 |

---

## localStorage 키

| 키 | 내용 |
|---|---|
| `haru1sojae-presets` | 소재비 입력값 4개 슬롯 |
| `haru1sojae-char-metas` | 캐릭터 메타(ocid, 보약, 이미지 등) 4슬롯 |
| `haru1sojae-num-slots` | 활성 슬롯 수 |
| `maple-char-${ocid}` | CharacterCard 경험치 히스토리 캐시 (7일) |
| `maple-dark-mode` | 다크모드 여부 |

---

## 남은 작업 / 알려진 이슈

- 없음 (현재 안정 상태)

---

## 주요 설계 결정

- **경험치 캐시 키**: CharacterCard는 `maple-char-${ocid}`에 저장. `loadTodayExpRateFrom()`이 이 키를 읽어 마운트 시 복원
- **보약 수치**: CharacterCard 검색 시 skill API 파싱 → `charMeta`에 저장 → `ExpContentsTab` props로 전달, 각 컴포넌트 로컬 state와 동기화
- **시뮬레이터 경험치%**: localStorage 별도 저장 없이 `todayExpRate` prop에서만 받음
- **URL 유지**: `[[...slug]]` 라우트 + `replaceState` + `initialSelected` prop
- **page.tsx 편집**: Edit 툴 사용 시 파일 잘림 현상 있음 → 항상 Python `data.replace(old, new, 1)` 방식 사용
