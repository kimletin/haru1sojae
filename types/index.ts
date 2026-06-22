export type EpicDungeonZone = '하이마운틴' | '앵글러컴퍼니' | '악몽선경';
export type SundayType = '일반' | '썬데이' | '스페셜';

export interface MobGroup {
  level: number;
  count: number;
}

export interface InputValues {
  waterBottleRate: number;      // 물통 시세
  mesoMarketRate: number;       // 메소마켓 시세
  charLevel: number;            // 캐릭터 레벨
  monsterLevel: number;         // 몬스터 레벨 (단일 레벨 or 대표 레벨)
  dailySessions: number;        // 하루 소재 횟수
  mobCount: number;             // 젠당 마릿수 (합계)
  huntingRegion: string;        // 선택된 지역
  huntingGround: string;        // 선택된 사냥터
  huntingMobs: MobGroup[];      // 사냥터 몹 구성 (혼합 레벨 대응)
  boosterMonsterLevel: number;  // 부스터 몹 경험치 기준 레벨
  booster30min: number;         // 황금태엽/VIP/헥사 부스터 (30분 내)
  eternal30min: number;         // 영겁의 황금태엽 (30분 내)
  booster1day: number;          // 황금태엽/VIP/헥사 부스터 (1일 평균)
  eternal1day: number;          // 영겁의 황금태엽 (1일 평균)
  price50: number;              // 추가경험치 50% 가격
  price70: number;              // 추가경험치 70% 가격
  price2x: number;              // 2배 쿠폰
  price3x: number;              // 3배 쿠폰
  price4x: number;              // 4배 쿠폰
  priceSmallBooster: number;    // 소경축비
  priceLargeBooster: number;    // 고농축비
  priceAzmos: number;           // 아즈모스 영약
  priceHunterTitle: number;     // 사냥 칭호 (30일)
  priceBloodRingMeso: number;   // 혈맹의 반지 (메소)
  priceBoostringMeso: number;   // 부스트링 (메소)
  priceJungpenMeso: number;     // 정펜 (메소)
  epicDungeonZone: EpicDungeonZone;
  monsterParkZone: string;      // 선택된 몬스터파크 지역
  boosterRate: number;          // 보약
}

export interface CharMeta {
  ocid: string | null;
  image: string | null;
  imageUpdatedAt: number | null;
  guild: string | null;
  class: string | null;
  world: string | null;
  dateCreate: string | null;    // 캐릭터 생성일 (Nexon character_date_create)
  monsterParkBonus: number | null;
  epicDungeonBonus: number | null;
  monsterParkBonuses: { name: string; pct: number; icon: string | null }[] | null;
  epicDungeonBonuses: { name: string; pct: number; icon: string | null }[] | null;
  treasureBonus: number | null;
  treasureBonuses: { name: string; pct: number; icon: string | null }[] | null;
  skillUpdatedAt: number | null;
  manualExpRate: number | null;
}

export interface EfficiencyItem {
  name: string;
  category: '30분 도핑' | '30일 도핑' | 'BM' | '마진';
  exp: number;
  priceMeso: number;
  efficiency: number;           // 가성비 (exp/meso)
  ratio: number;                // 가성비 배율 (relative to VIP 사우나)
}
