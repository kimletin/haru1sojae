import type { InputValues } from '@/types';

/** 새 캐릭터 슬롯의 기본 입력값. 캐릭터 정보 모달의 '초기화'도 이 값으로 되돌린다.
 *  (시세·가격은 운영하면서 갱신하므로, 0으로 비우는 대신 최신 기준값으로 돌아가는 편이 쓸모 있다) */
export const DEFAULT_INPUTS: InputValues = {
  waterBottleRate: 1450,
  mesoMarketRate: 2100,
  charLevel: 260,
  monsterLevel: 260,
  dailySessions: 10,
  mobCount: 34,
  huntingRegion: '세르니움',
  huntingGround: '해변 암석 지대 1',
  huntingMobs: [{ level: 260, count: 34 }],
  boosterMonsterLevel: 260,
  booster30min: 3,
  booster1day: 6,
  expBonus: 500,
  masterLabelCount: 0,
  masterLabelCost: 0,
  price50: 100_000,
  price70: 2_500_000,
  price3x: 80_000_000,
  price4x: 250_000_000,
  priceSmallBooster: 1_000_000,
  priceLargeBooster: 5_500_000,
  priceHunterTitle: 2_000_000_000,
  priceBloodRingMeso: 350_000_000,
  priceBoostringMeso: 850_000_000,
  priceJungpenMeso: 1_000_000_000,
  jungpenDays: 90,
  // 아직 본섭 미출시 — 시세가 잡히기 전까지 쓰는 임시 기본가
  priceMagnifier: 3_000_000,
  priceYetiMagnifier: 100_000_000,
  epicDungeonZone: '하이마운틴',
  monsterParkZone: '세르니움',
  boosterRate: 0.5,
  personalBoss: {},
};

/** 초기화가 건드리지 않는 필드 — 캐릭터 본인의 값이라 유지한다 */
export const RESET_KEEP_KEYS = ['charLevel', 'personalBoss'] as const;
