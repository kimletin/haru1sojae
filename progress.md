# 하루1소재 - 프로젝트 진행 현황

## 프로젝트 개요

메이플스토리 경험치 효율 계산기. 경험치 아이템 별 가성비를 비교하고, 각 경험치 콘텐츠의 레벨별 획득량을 한눈에 확인하는 웹 앱.

- **스택**: Next.js App Router, TypeScript, Tailwind CSS v4
- **라우팅**: `app/[[...slug]]/page.tsx` 단일 catch-all 라우트
- **캐릭터 슬롯**: 최대 6개(`NUM_PRESETS=6`), 첫 방문 시 0개

### 용어
- **소재**: "소형 재물 획득의 아이템 비약"의 줄임말(메이플 인게임 소비 아이템).
- **1소재 = 30분 사냥**: 소재(비약) 1개 지속시간이 30분이라, "1소재"는 30분 동안 사냥하는 것을 뜻함.
- **앱 이름 "하루1소재"**: 하루에 1소재(=30분 사냥)만큼 한다는 의미. 그래서 계산 기준 단위가 "30분 도핑/사냥"임.

---

## 메인탭 (경험치 효율표) 레이아웃

```
[좌측 main, w-560]                 [우측 aside, flex-1]
 ├ CharacterCard (캐릭터 정보+히스토리)   ├ InputSummaryCard (사냥/컨텐츠 정보 + 보약 정보)
 └ EfficiencyTab (효율표, 읽기전용)       └ RankingPanel (가성비 순위)
```

- **InputPanel은 제거됨.** 모든 입력값은 **CharacterInfoModal("입력 정보 수정")** 에서 편집한다. 모달은 `InputSummaryCard` 헤더의 "정보 수정" 버튼으로 연다.
- 첫 방문(캐시 없음) 시 어느 탭 URL로 들어와도 **효율표 탭으로 redirect** + URL을 `/`로 초기화.

### CharacterCard
- 좌: 캐릭터 정보(닉네임/월드, 레벨+오늘 경험치%, 길드, 직업, **생성일** `YY.MM.DD`)
- 우: **경험치 히스토리(7일)** 막대 그래프 — 레벨/경험치% 라벨, 날짜, 호버 툴팁(획득량·델타). 하루 다중 레벨업도 `levelExp` 테이블로 보정해 계산.
- 우상단 새로고침 버튼(1분 쿨다운), "최근 업데이트" 라벨.
- 보약 아이콘/수치는 **InputSummaryCard로 이전**됨.

### EfficiencyTab (읽기 전용)
- **경험치 도핑(30분)**: 추가경험치 50%, 추가경험치 50%→70%(마진), 2·3·4배 쿠폰, 소경축비, 소경축비→고농축비(마진), 아즈모스 영약
- **경험치 도핑(30일)**: 부티크 사냥 칭호, 혈맹의 반지(메소/메포), 부스트링(메소/메포), 정령의 펜던트(메소/메포) — 같은 항목 메소/메포 인접 정렬
- **경험치 BM**: 에픽 던전 0→1·1→2단계, 몬스터파크(일반/썬데이/스페셜 3행), VIP 사우나
- 가격(메소) 열은 모달에서 입력한 값 기반 읽기 전용. 행 높이 36px(RankingPanel과 일치).

### InputSummaryCard (우측 상단)
- **사냥/컨텐츠 정보** 카드: 일 평균 재획, 30분/1일 평균 부스터, 에픽 던전, 사냥터(지역·사냥터). 헤더 우측에 "정보 수정" 버튼.
- **보약 정보** 카드: 상단에 보약 아이콘 목록(툴팁) + 구분선, 아래에 몬스터파크/에픽 던전/트레져 헌터 보너스 %.

### RankingPanel (가성비 순위)
- `calcAllItems` 결과를 효율(경험치/메소) 내림차순 정렬해 표시. 행 높이 36px.

---

## 캐릭터 추가/수정 흐름

### CharacterSearchModal (캐릭터 추가) — 2단계 위저드
1. **Step 1 선택**: 검색 모드(닉네임 API 조회) ↔ 수동 모드("수동 추가"/"뒤로" 전환). 검색 결과 버튼은 **"다음"**, 만렙(≥300)·중복·**260미만**이면 비활성.
2. **Step 2 정보 입력**: `CharacterInfoStep` 렌더, "추가"로 확정 → `onConfirm(info, inputs)`.

### CharacterInfoModal (입력 정보 수정)
- 헤더 "입력 정보 수정", 내부에 `CharacterInfoStep`(submitLabel "적용", `disableIfUnchanged`).
- **dirty 판정이 이 적용 버튼으로 이관됨**: `d`(작업본)와 `initialInputs`(현재 적용값) JSON 비교 → 변경 없으면 비활성.

### CharacterInfoStep (3열 폼, 두 모달 공용)
- 1열: 시세 정보(물통 비활성, 메소마켓 메포, 30분/30일 도핑 가격 메소)
- 2열: 일 평균 재획(스테퍼) + 부스터(30분/1일, ? 툴팁) + 에픽 던전(직사각형 버튼, 레벨 제한 `Lv.xxx~`)
- 3열: 사냥터 — 지역 3×3 직사각형 버튼(8개 + 마지막 칸 빈칸, 레벨 미달 비활성) + 사냥터 목록(높이는 1열 기준, 목록만 스크롤)
- prop: `onBack?`(있을 때만 "뒤로"), `submitLabel`, `disableIfUnchanged`

---

## 경험치 콘텐츠탭 (ExpContentsTab)

URL 유지: 탭 전환 시 `/cont/{key}` `replaceState`, 새로고침 시 복원.

| 서브탭 | 주요 기능 |
|---|---|
| 에픽 던전 | 3구간(하이마운틴/앵글러컴퍼니/악몽선경) 레벨별 경험치·메포, 보약, 시뮬레이터 |
| 몬스터파크 | 구간별 경험치, 일반/썬데이/스페셜, 보약, 시뮬레이터 |
| 트레져 헌터 | 골드/다이아 박스 등급별 경험치, 썬데이, 보약 |
| 블루베리 / 메카베리 농장 | 레벨별 경험치, 시뮬레이터 |
| VIP 사우나 / 슈퍼경험치 쿠폰 | 레벨별 경험치, 시뮬레이터 |

표 카드 스크롤은 `overflow-y-scroll`로 스크롤바 폭 일관화(메카↔블루베리 밀림 방지).

### 그 외 탭
- **경험치 정보(ExpInfoTab)**: 좌 레벨별 필요 경험치 / 우 **경험치 패널티 표**(인게임 표 그대로, 선형 구간은 범위 1행 + "비고"). 두 카드 스크롤 없이 전체 표시.
- **사냥터 정보 / 정보 센터**.

---

## 핵심 계산식 (lib/calculator.ts)

- **`getExpMultiplier(charLevel, monsterLevel)`**: diff별 경험치 배율. **diff 21~39 구간은 `(110-diff)/100`** (39→0.71, 21→0.89). 인게임 표와 일치(과거 `(diff+50)/100` 오류 수정).
- **에픽 던전 가격**: `메포→메소 − 세라자르 주화 4개(4천만×4=1.6억)`. (과거 솔에르다 차감 → 변경)
- **몬스터파크**: 일반/썬데이(+50%)/스페셜(+300%) 3종을 각각 항목으로 생성.
- `calcAllItems`가 30분/30일/BM/마진 항목을 모두 만들어 효율순 정렬.

---

## 데이터 파일

`data/`: epicDungeon, monsterPark, treasureHunter, vipSauna, superExpCoupon, mekaberry, blueberry, levelExp(260~300), monsterExp, huntingGrounds, classRanking

- `EpicDungeonZone`: `'하이마운틴' | '앵글러컴퍼니' | '악몽선경'` (구 `'앵컴'` 폐기, 로드 시 마이그레이션)
- `SundayType`: `'일반' | '썬데이' | '스페셜'` (구 `'평일'` → `'일반'`)

---

## API 라우트 (`app/api/character/*`)

| 경로 | 역할 |
|---|---|
| `/api/character` | 닉네임→ocid→기본정보, 또는 ocid 직접조회(이미지/레벨/직업/월드/길드/**생성일**) |
| `/api/character/history` | 경험치 히스토리(최근 7일, 일별 호출) |
| `/api/character/ranking` | 종합/월드/직업 랭킹 |
| `/api/character/skill` | 스킬(grade 0) → 몬파/에픽/트레져 보약 % 파싱 |

- 공통: 8초 타임아웃, Nexon 상태코드별 에러 매핑.
- `CharacterCard.doRefresh`는 4개를 병렬 호출하되 **소스별 성공 판정**(하나 실패해도 나머지 독립 반영). 쿨다운/라벨은 히스토리 성공 시에만 시작. 캐시는 성공 항목만 병합.

---

## localStorage 키

| 키 | 내용 |
|---|---|
| `haru1sojae-presets` | 입력값 프리셋 6슬롯 |
| `haru1sojae-preset-names` | 슬롯 닉네임 |
| `haru1sojae-active-preset` | 활성 슬롯 인덱스 |
| `haru1sojae-num-slots` | 활성 슬롯 수 |
| `haru1sojae-char-meta` | 캐릭터 메타(ocid/이미지/직업/생성일/보약 등) |
| `maple-char-${ocid}` | 경험치 히스토리+랭킹 캐시 |
| `maple-dark-mode` | 다크모드 여부 |

---

## 주요 설계 결정 / 작업 규칙

- **page.tsx 편집**: Edit 툴 잘림 위험 → 항상 Python `data.replace(old, new, 1)` + `assert old in data`. 수정 후 `npx tsc --noEmit`.
- **스크롤 잠금**: 페이지 스크롤을 `#app-scroll`(본문 컨테이너)로 두고 헤더는 그 밖. 모달은 `lib/scrollLock`의 `lockScroll/unlockScroll`로 `#app-scroll` overflow를 토글(스크롤바 폭 보정/거터 불필요 — 띠 안 생김).
- **dirty 적용**: 입력값 변경은 모달의 작업본(`d`)에서 이뤄지고, 모달의 "적용" 버튼이 변경 시에만 활성화되어 `handleApply`로 커밋(+프리셋 저장).
- **캐시 정리**: 슬롯 삭제 시 `maple-char-${ocid}` 제거. 구버전 키/죽은 쓰기 정리 완료.
- **공용 컴포넌트**: `ItemName`(몬파 지역/변형·메소/메포 뱃지), `Num`, `TooltipWrapper`.

---

## 남은 작업 / 알려진 사항

- 현재 안정 상태. 캐릭터 카드는 좌(정보)+우(히스토리) 2분할(중앙 빈칸 실험은 철회).
- 미처리(저우선): skill API는 grade 0만 조회(다른 등급 보약 누락 가능), Nexon 당일 데이터 미생성 시 오늘 막대가 전일과 동일할 수 있음(데이터 가용성 한계).
