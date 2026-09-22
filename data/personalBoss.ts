// 퍼스널 버닝 이벤트 — 보스 처치 경험치 (기간: 2026-09-24 ~ 2026-11-18)
//
// ⚠️ 이벤트 한정 데이터. 종료 후 이벤트/컨텐츠 탭의 '퍼스널 보스' 메뉴와 함께 지운다:
//    이 파일, public/boss/, components/boss/PersonalBossTab.tsx,
//    ExpContentsTab의 MENU_ITEMS 항목 · 퍼스널 보스 렌더 · 관련 props, PageClient가 넘기는 퍼스널 보스 props,
//    InputValues.personalBoss(+ DEFAULT_INPUTS), assetSlugs '퍼스널 버닝'(+ public/icons/PersonalBurning.png)
//
// exp      : 보스 1회 처치 경험치 — 만 단위(게임 표기 그대로). 파티원 수로 똑같이 나눈다(소수점 버림).
// maxParty : 해당 난이도 최대 입장 인원
// 이벤트 대상 난이도만 둔다 — 비대상 난이도(예: 데미안 노말)는 화면에도 보이지 않는다.

export type BossDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'CHAOS' | 'EXTREME';

export interface BossDifficultyInfo {
  difficulty: BossDifficulty;
  exp: number;
  maxParty: number;
}

export interface PersonalBoss {
  /** 표시 이름 = 캐릭터별 선택 저장 키 */
  name: string;
  /** public/boss/{icon}.png */
  icon: string;
  difficulties: BossDifficultyInfo[];
}

/** 캐릭터당 한 주에 처치 경험치를 받을 수 있는 보스 수 */
export const PERSONAL_BOSS_MAX_SELECT = 12;

/** 이벤트 기간 (KST). 시작일은 주간 보스 초기화일(목요일) — 9/24 ~ 11/18 = 8주 */
export const PERSONAL_BOSS_EVENT_START = '2026-09-24';
export const PERSONAL_BOSS_EVENT_END = '2026-11-18';

/** exp 단위(만) → 경험치 */
export const PERSONAL_BOSS_EXP_UNIT = 10_000;

// 게임의 보스 진행 순서
export const PERSONAL_BOSSES: PersonalBoss[] = [
  { name: '스우', icon: 'Lotus', difficulties: [
    { difficulty: 'HARD',    exp: 3_462_860,   maxParty: 6 },
    { difficulty: 'EXTREME', exp: 40_348_100,  maxParty: 2 },
  ] },
  { name: '데미안', icon: 'Damien', difficulties: [
    { difficulty: 'HARD',    exp: 3_434_980,   maxParty: 6 },
  ] },
  { name: '가디언 엔젤 슬라임', icon: 'GuardianAngelSlime', difficulties: [
    { difficulty: 'CHAOS',   exp: 5_049_150,   maxParty: 6 },
  ] },
  { name: '루시드', icon: 'Lucid', difficulties: [
    { difficulty: 'HARD',    exp: 4_419_800,   maxParty: 6 },
  ] },
  { name: '윌', icon: 'Will', difficulties: [
    { difficulty: 'HARD',    exp: 5_419_380,   maxParty: 6 },
  ] },
  { name: '더스크', icon: 'Dusk', difficulties: [
    { difficulty: 'CHAOS',   exp: 5_121_720,   maxParty: 6 },
  ] },
  { name: '진 힐라', icon: 'VerusHilla', difficulties: [
    { difficulty: 'HARD',    exp: 7_403_370,   maxParty: 6 },
  ] },
  { name: '듄켈', icon: 'Dunkel', difficulties: [
    { difficulty: 'HARD',    exp: 6_345_160,   maxParty: 6 },
  ] },
  { name: '선택받은 세렌', icon: 'Seren', difficulties: [
    { difficulty: 'NORMAL',  exp: 11_288_530,  maxParty: 6 },
    { difficulty: 'HARD',    exp: 23_330_230,  maxParty: 6 },
    { difficulty: 'EXTREME', exp: 130_298_820, maxParty: 6 },
  ] },
  { name: '감시자 칼로스', icon: 'Kalos', difficulties: [
    { difficulty: 'EASY',    exp: 16_087_580,  maxParty: 6 },
    { difficulty: 'NORMAL',  exp: 32_378_520,  maxParty: 6 },
    { difficulty: 'CHAOS',   exp: 83_142_670,  maxParty: 6 },
    { difficulty: 'EXTREME', exp: 303_832_960, maxParty: 6 },
  ] },
  { name: '최초의 대적자', icon: 'FirstAdversary', difficulties: [
    { difficulty: 'EASY',    exp: 17_642_300,  maxParty: 3 },
    { difficulty: 'NORMAL',  exp: 35_961_100,  maxParty: 3 },
    { difficulty: 'HARD',    exp: 98_432_390,  maxParty: 3 },
    { difficulty: 'EXTREME', exp: 379_179_480, maxParty: 3 },
  ] },
  { name: '카링', icon: 'Kaling', difficulties: [
    { difficulty: 'EASY',    exp: 21_630_780,  maxParty: 6 },
    { difficulty: 'NORMAL',  exp: 44_497_300,  maxParty: 6 },
    { difficulty: 'HARD',    exp: 110_470_810, maxParty: 6 },
    { difficulty: 'EXTREME', exp: 416_157_790, maxParty: 6 },
  ] },
  { name: '찬란한 흉성', icon: 'MaleficStar', difficulties: [
    { difficulty: 'NORMAL',  exp: 41_993_020,  maxParty: 3 },
    { difficulty: 'HARD',    exp: 198_261_240, maxParty: 3 },
  ] },
  { name: '벨로나', icon: 'Bellona', difficulties: [
    { difficulty: 'EASY',    exp: 26_768_080,  maxParty: 3 },
    { difficulty: 'NORMAL',  exp: 63_655_780,  maxParty: 3 },
    { difficulty: 'HARD',    exp: 227_893_990, maxParty: 3 },
  ] },
  { name: '림보', icon: 'Limbo', difficulties: [
    { difficulty: 'NORMAL',  exp: 76_865_980,  maxParty: 3 },
    { difficulty: 'HARD',    exp: 191_923_460, maxParty: 3 },
  ] },
  { name: '발드릭스', icon: 'Baldrix', difficulties: [
    { difficulty: 'NORMAL',  exp: 97_724_320,  maxParty: 3 },
    { difficulty: 'HARD',    exp: 237_782_370, maxParty: 3 },
  ] },
  { name: '유피테르', icon: 'Jupiter', difficulties: [
    { difficulty: 'NORMAL',  exp: 115_492_080, maxParty: 3 },
    { difficulty: 'HARD',    exp: 389_882_120, maxParty: 3 },
  ] },
];
