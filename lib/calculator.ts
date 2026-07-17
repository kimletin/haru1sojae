import { MONSTER_EXP } from '@/data/monsterExp';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { BLUEBERRY_EXP } from '@/data/blueberry';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MONSTER_PARK_EXP } from '@/data/monsterPark';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY, DUNGEON_METACOIN } from '@/data/epicDungeon';

import type { InputValues, EfficiencyItem, EpicDungeonZone, SundayType, MobGroup } from '@/types';

/** 캐릭터 레벨 - 몬스터 레벨(diff) 차이에 따른 경험치 배율 (인게임 표 기준) */
export function getExpMultiplier(charLevel: number, monsterLevel: number): number {
  const diff = charLevel - monsterLevel;
  if (diff >= 40) return 0.70;                    // 40 이상
  if (diff >= 21) return (110 - diff) / 100;      // 39~21: 0.71~0.89 (1레벨당 0.01)
  if (diff >= 19) return 0.95;                    // 20~19
  if (diff >= 17) return 0.96;                    // 18~17
  if (diff >= 15) return 0.97;                    // 16~15
  if (diff >= 13) return 0.98;                    // 14~13
  if (diff >= 11) return 0.99;                    // 12~11
  if (diff === 10) return 1.00;                   // 10
  if (diff >= 5)  return 1.05;                    // 9~5
  if (diff >= 2)  return 1.10;                    // 4~2
  if (diff >= -1) return 1.20;                    // 1~-1 (최대 배율)
  if (diff >= -4) return 1.10;                    // -2~-4
  if (diff >= -9) return 1.05;                    // -5~-9
  if (diff >= -20) return (110 + diff) / 100;     // -10~-20: 1.00~0.90 (1레벨당 0.01)
  if (diff >= -35) return (diff * 4 + 154) / 100; // -21~-35: 0.70~0.14 (1레벨당 0.04)
  if (diff >= -39) return 0.10;                   // -36~-39
  return 0;                                       // -40 이하 (몬스터에 1 데미지)
}

/** 메포 가격 → 메소 환산 (메소마켓에서 메소를 메포로 바꿀 때 수수료 1% 차감되므로 /0.99 보정) */
export function mepoToMeso(mepo: number, mesoMarketRate: number): number {
  return mepo / 0.99 / mesoMarketRate * 100_000_000;
}

/** 넥슨캐시 가격 → 메소 환산. waterBottleRate(물통 시세)는 1억 메소당 원 단위.
 *  예: 물통 시세 1800원이면 49,800캐시 = 49800/1800 = 약 27.67억 메소.
 *  시세 미입력(0)이면 계산 불가로 0을 반환한다(효율 계산에서 "-" 처리됨). */
export function cashToMeso(cash: number, waterBottleRate: number): number {
  return waterBottleRate > 0 ? cash / waterBottleRate * 100_000_000 : 0;
}

/** huntingMobs를 기반으로 한 사냥 핵심 경험치 (1회 사냥, 배율 포함) */
function getHuntingExpCore(charLevel: number, mobs: MobGroup[]): number {
  return mobs.reduce((sum, mob) => {
    const monsterExp = MONSTER_EXP[mob.level] ?? 0;
    const expMult = getExpMultiplier(charLevel, mob.level);
    return sum + monsterExp * expMult * mob.count;
  }, 0);
}

/** inputs에서 MobGroup[] 추출 */
function getMobs(inputs: InputValues): MobGroup[] {
  if (inputs.huntingMobs && inputs.huntingMobs.length > 0) return inputs.huntingMobs;
  return [{ level: inputs.monsterLevel, count: inputs.mobCount }];
}

/** 부스터 몹 기준 경험치 */
function getBoosterMonsterExp(inputs: InputValues): number {
  const level = inputs.boosterMonsterLevel ?? inputs.monsterLevel;
  return MONSTER_EXP[level] ?? 0;
}

/** 30분 사냥 기본 경험치 (배율 적용 전) */
export function getBase30MinExp(inputs: InputValues): number {
  const mobs    = getMobs(inputs);
  const huntExp = getHuntingExpCore(inputs.charLevel, mobs) * 240;
  const repExp  = getBoosterMonsterExp(inputs);
  return (
    huntExp +
    repExp * 10 * 190 * inputs.booster30min +
    repExp * 200 * 190 * inputs.eternal30min
  );
}

/** 30일 사냥 기본 경험치 (배율 적용 전) */
export function getBase30DayExp(inputs: InputValues): number {
  const mobs    = getMobs(inputs);
  const huntExp = getHuntingExpCore(inputs.charLevel, mobs) * 240 * inputs.dailySessions;
  const repExp  = getBoosterMonsterExp(inputs);
  return (
    huntExp +
    repExp * 10 * 190 * inputs.booster1day +
    repExp * 200 * 190 * inputs.eternal1day
  ) * 30;
}

/** VIP 사우나 경험치 */
export function getVipSaunaExp(charLevel: number): number {
  return VIP_SAUNA_EXP[charLevel] ?? 0;
}

/** VIP 사우나 메소 가격 */
export function getVipSaunaPrice(mesoMarketRate: number): number {
  return mepoToMeso(3000, mesoMarketRate);
}

/** VIP 사우나 가성비 (기준값) */
export function getVipEfficiency(inputs: InputValues): number {
  const exp = getVipSaunaExp(inputs.charLevel);
  const price = getVipSaunaPrice(inputs.mesoMarketRate);
  return price > 0 ? exp / price : 0;
}

/** 몬스터파크 경험치 (썬데이/보약 적용) */
export function getMonsterParkExp(
  zone: string,
  sunday: SundayType,
  monsterParkBonus: number = 0  // API에서 받은 % 값
): number {
  const base = MONSTER_PARK_EXP[zone] ?? 0;
  const sundayBonus = sunday === '썬데이' ? 0.5 : sunday === '스페셜' ? 3.0 : 0;
  return base * (1 + sundayBonus + monsterParkBonus / 100);
}

/** 에픽 던전 데이터 조회 */
function getEpicDungeonTable(zone: EpicDungeonZone) {
  if (zone === '하이마운틴') return HAIMOUNTAIN;
  if (zone === '앵글러컴퍼니') return ANGLER_COMPANY;
  return NIGHTMARE_SANCTUARY;
}

/** 에픽 던전 0→1단계 경험치 */
export function getEpicDungeonStage01Exp(zone: EpicDungeonZone, charLevel: number): number {
  const table = getEpicDungeonTable(zone);
  const data = table[charLevel];
  if (!data) return 0;
  return data.stage1 - data.stage0;
}

/** 에픽 던전 1→2단계 경험치 */
export function getEpicDungeonStage12Exp(zone: EpicDungeonZone, charLevel: number): number {
  const table = getEpicDungeonTable(zone);
  const data = table[charLevel];
  if (!data) return 0;
  return data.stage2 - data.stage1;
}

/** 세라자르 주화 1개당 메소 가치 (메포를 내고 받는 보상이므로 에픽 던전 비용에서 차감) */
const SERAJAR_COIN_PRICE = 40_000_000;
const EPIC_SERAJAR_COIN_COUNT = 4;

/** 에픽 던전 메소 가격 (0→1) */
export function getEpicDungeonStage01Price(zone: EpicDungeonZone, mesoMarketRate: number): number {
  const metacoin = DUNGEON_METACOIN[zone]?.stage1 ?? 0;
  return mepoToMeso(metacoin, mesoMarketRate) - SERAJAR_COIN_PRICE * EPIC_SERAJAR_COIN_COUNT;
}

/** 에픽 던전 메소 가격 (1→2) */
export function getEpicDungeonStage12Price(zone: EpicDungeonZone, mesoMarketRate: number): number {
  const metacoin = DUNGEON_METACOIN[zone]?.stage2 ?? 0;
  return mepoToMeso(metacoin, mesoMarketRate) - SERAJAR_COIN_PRICE * EPIC_SERAJAR_COIN_COUNT;
}

/** 메카베리 농장 / 프라임 모멘텀 패스 사용 가능 최소 레벨 */
export const MEKABERRY_MIN_LEVEL = 280;

/** 메카베리 농장 경험치 */
export function getMekaberryExp(charLevel: number): number {
  if (charLevel < MEKABERRY_MIN_LEVEL) return 0;
  return MEKABERRY_EXP[charLevel] ?? 0;
}

/** 블루베리 농장 경험치 */
export function getBlueberryExp(charLevel: number): number {
  return BLUEBERRY_EXP[charLevel] ?? 0;
}

/** 농장 입장권 메포 판매가 (인게임 상점) */
const MEKABERRY_TICKET_MEPO = 10_000;
const BLUEBERRY_TICKET_MEPO = 7_000;

/** 메카베리 농장 입장권 메소 가격 */
export function getMekaberryPrice(mesoMarketRate: number): number {
  return mepoToMeso(MEKABERRY_TICKET_MEPO, mesoMarketRate);
}

/** 블루베리 농장 입장권 메소 가격 */
export function getBlueberryPrice(mesoMarketRate: number): number {
  return mepoToMeso(BLUEBERRY_TICKET_MEPO, mesoMarketRate);
}

/** 상급 EXP 쿠폰 1개당 경험치 */
export function getSuperExpCouponExp(charLevel: number): number {
  return SUPER_EXP_COUPON[charLevel] ?? 0;
}

/** 프라임 모멘텀 패스 — 넥슨캐시 49,800원. 구성품: 메카베리 농장 입장권 10개 +
 *  상급 EXP 쿠폰 9,000개 + 경험치 4배 쿠폰 6개 */
const PRIME_PASS_CASH = 49_800;
const PRIME_PASS_MEKABERRY_COUNT = 10;
const PRIME_PASS_SUPER_COUPON_COUNT = 9_000;
const PRIME_PASS_4X_COUPON_COUNT = 6;

/** 프라임 모멘텀 패스 총 경험치 (base30 = 30분 사냥 기본 경험치, 4배 쿠폰 1개 = base30 * 3)
 *  구성품에 메카베리 입장권이 들어 있어 280 미만은 상품 자체를 쓸 수 없다. 메카베리분만 0이 되게
 *  두면 상급쿠폰·4배쿠폰분이 남아 그럴듯한 값이 나오므로 전체를 0으로 막는다. */
export function getPrimePassExp(charLevel: number, base30: number): number {
  if (charLevel < MEKABERRY_MIN_LEVEL) return 0;
  return (
    getMekaberryExp(charLevel) * PRIME_PASS_MEKABERRY_COUNT +
    getSuperExpCouponExp(charLevel) * PRIME_PASS_SUPER_COUPON_COUNT +
    base30 * 3 * PRIME_PASS_4X_COUPON_COUNT
  );
}

/** 프라임 모멘텀 패스 메소 가격 */
export function getPrimePassPrice(waterBottleRate: number): number {
  return cashToMeso(PRIME_PASS_CASH, waterBottleRate);
}

/** 하위→상위 티어 행을 어떻게 보여줄지 결정.
 *
 *  수학적으로 `마진효율 > 상위단일효율` ⟺ `상위단일효율 > 하위단일효율` 이 항상 성립한다.
 *  즉 상위가 더 효율적일 땐 마진이 두 단일 효율보다도 높게 나와 순위 1위로 뻥튀기되는데,
 *  증분(예: +20%)만 따로 살 수는 없으므로 과대평가다. 이 경우엔 실제로 살 수 있는
 *  '상위 단일'을 보여준다("그냥 상위를 사라").
 *  반대로 상위가 더 비효율적이면 마진을 보여준다(이미 하위를 쓰는 사람의 갈아타기 판단용). */
export function tierRow(
  upgradeName: string, standaloneName: string,
  lowerExp: number, lowerPrice: number,
  upperExp: number, upperPrice: number,
): { name: string; exp: number; priceMeso: number; isUpgrade: boolean } {
  const effLower = lowerPrice > 0 ? lowerExp / lowerPrice : 0;
  const effUpper = upperPrice > 0 ? upperExp / upperPrice : 0;
  if (effUpper > effLower) {
    return { name: standaloneName, exp: upperExp, priceMeso: upperPrice, isUpgrade: false };
  }
  return { name: upgradeName, exp: upperExp - lowerExp, priceMeso: upperPrice - lowerPrice, isUpgrade: true };
}

/** 30분 도핑 티어 4종(추경 70% / 경3쿠 / 경4쿠 / 고농축비)의 표시 행 계산 — 순위·효율표 공용 */
export function getDoping30Tiers(inputs: InputValues, base30: number) {
  return {
    exp70:   tierRow('추가경험치 50%→70%', '추가경험치 70%', base30 * 0.5, inputs.price50,             base30 * 0.7, inputs.price70),
    coupon3: tierRow('2배 쿠폰→3배 쿠폰',   '3배 쿠폰',       base30 * 1,   inputs.price2x,             base30 * 2,   inputs.price3x),
    coupon4: tierRow('3배 쿠폰→4배 쿠폰',   '4배 쿠폰',       base30 * 2,   inputs.price3x,             base30 * 3,   inputs.price4x),
    booster: tierRow('소경축비→고농축비',   '고농축비',       base30 * 0.1, inputs.priceSmallBooster,   base30 * 0.2, inputs.priceLargeBooster),
  };
}

/** 전체 가성비 아이템 목록 계산 */
export function calcAllItems(inputs: InputValues, monsterParkBonus: number = 0): EfficiencyItem[] {
  const vipEff = getVipEfficiency(inputs);
  const base30 = getBase30MinExp(inputs);
  const base30d = getBase30DayExp(inputs);

  const item = (
    name: string,
    category: EfficiencyItem['category'],
    exp: number,
    priceMeso: number
  ): EfficiencyItem => {
    const efficiency = priceMeso > 0 ? exp / priceMeso : 0;
    return { name, category, exp, priceMeso, efficiency, ratio: vipEff > 0 ? efficiency / vipEff : 0 };
  };

  const { epicDungeonZone, charLevel, mesoMarketRate } = inputs;
  const epicName = epicDungeonZone;

  const stage01Exp   = getEpicDungeonStage01Exp(epicDungeonZone, charLevel);
  const stage12Exp   = getEpicDungeonStage12Exp(epicDungeonZone, charLevel);
  const stage01Price = getEpicDungeonStage01Price(epicDungeonZone, mesoMarketRate);
  const stage12Price = getEpicDungeonStage12Price(epicDungeonZone, mesoMarketRate);

  const parkZone  = inputs.monsterParkZone;
  const parkPrice = mepoToMeso(600, mesoMarketRate);

  const vipExp   = getVipSaunaExp(charLevel);
  const vipPrice = getVipSaunaPrice(mesoMarketRate);

  // 혈맹의 반지/부스트링/정펜 메포 가격
  const bloodRingMetaPrice = mepoToMeso(5900, mesoMarketRate);
  const boostringMetaPrice = mepoToMeso(29900, mesoMarketRate);
  const jungpenMetaPrice   = mepoToMeso(49900, mesoMarketRate);

  // 상위 티어는 상황에 따라 '상위 단일' 또는 '하위→상위 마진'으로 표시된다 (tierRow 주석 참고)
  const tiers = getDoping30Tiers(inputs, base30);
  const tierItem = (t: ReturnType<typeof tierRow>) =>
    item(t.name, t.isUpgrade ? '마진' : '30분 도핑', t.exp, t.priceMeso);

  const items: EfficiencyItem[] = [
    // 30분 도핑
    item('추가경험치 50%',     '30분 도핑', base30 * 0.5, inputs.price50),
    tierItem(tiers.exp70),
    item('2배 쿠폰',            '30분 도핑', base30 * 1,   inputs.price2x),
    tierItem(tiers.coupon3),
    tierItem(tiers.coupon4),
    item('소경축비',            '30분 도핑', base30 * 0.1, inputs.priceSmallBooster),
    tierItem(tiers.booster),
    // 30일 도핑
    item('부티크 사냥 칭호',           '30일 도핑', base30d * 1,    inputs.priceHunterTitle),
    item('혈맹의 반지(메소)',    '30일 도핑', base30d * 0.1,  inputs.priceBloodRingMeso),
    item('경험치 부스트링(메소)',       '30일 도핑', base30d * 0.15, inputs.priceBoostringMeso),
    item('정령의 펜던트(메소)',           '30일 도핑', base30d * 0.3,  inputs.priceJungpenMeso),
    item('혈맹의 반지(메포)',    '30일 도핑', base30d * 0.1,  bloodRingMetaPrice),
    item('경험치 부스트링(메포)',       '30일 도핑', base30d * 0.15, boostringMetaPrice),
    item('정령의 펜던트(메포)',           '30일 도핑', base30d * 0.3,  jungpenMetaPrice),
    // BM
    item(`${epicName} 0→1단계`, 'BM', stage01Exp, stage01Price),
    item(`${epicName} 1→2단계`, 'BM', stage12Exp, stage12Price),
    item(`몬스터파크(${parkZone}) 일반`, 'BM', getMonsterParkExp(parkZone, '일반', monsterParkBonus), parkPrice),
    item(`몬스터파크(${parkZone}) 썬데이`, 'BM', getMonsterParkExp(parkZone, '썬데이', monsterParkBonus), parkPrice),
    item(`몬스터파크(${parkZone}) 스페셜`, 'BM', getMonsterParkExp(parkZone, '스페셜', monsterParkBonus), parkPrice),
    item('VIP 사우나',          'BM', vipExp, vipPrice),
    item('메카베리 농장 입장권', 'BM', getMekaberryExp(charLevel), getMekaberryPrice(mesoMarketRate)),
    item('블루베리 농장 입장권', 'BM', getBlueberryExp(charLevel), getBlueberryPrice(mesoMarketRate)),
    item('프라임 모멘텀 패스', 'BM', getPrimePassExp(charLevel, base30), getPrimePassPrice(inputs.waterBottleRate)),
  ];

  return items.sort((a, b) => b.ratio - a.ratio);
}
