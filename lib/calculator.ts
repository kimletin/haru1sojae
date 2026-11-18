import { MONSTER_EXP } from '@/data/monsterExp';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { CRIMSON_MEKABERRY_EXP } from '@/data/crimsonMekaberry';
import { BLUEBERRY_EXP } from '@/data/blueberry';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MONSTER_PARK_EXP } from '@/data/monsterPark';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY, AURUM_REGIS, DUNGEON_METACOIN } from '@/data/epicDungeon';

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
  // 시세 미입력(0)이면 계산 불가로 0을 반환한다(효율 계산에서 "-" 처리됨). 0으로 나눠 Infinity가 되는 것 방지.
  return mesoMarketRate > 0 ? mepo / 0.99 / mesoMarketRate * 100_000_000 : 0;
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

/** 현재 선택된 사냥터의 몹 1마리 경험치 (부스터 계산의 기준값).
 *  기준 레벨은 혼합 레벨 맵이면 지정된 boosterLevel, 아니면 그 맵의 최고 레벨 몹.
 *
 *  ⚠️ 사냥 경험치(getHuntingExpCore)와 달리 getExpMultiplier를 곱하지 않는다 —
 *     부스터몹은 레벨차 경험치 페널티를 받지 않기 때문. 빠뜨린 게 아니다. */
function getGroundMobExp(inputs: InputValues): number {
  const level = inputs.boosterMonsterLevel ?? inputs.monsterLevel;
  return MONSTER_EXP[level] ?? 0;
}

/** 부스터 1개가 스폰하는 부스터몹 마릿수 — 100초 동안 10마리씩 19번 젠 */
const BOOSTER_SPAWN_COUNT = 190;
/** 부스터몹 1마리 = 일반 몹 몇 마리분 경험치인지 (VIP/HEXA) */
const VIP_BOOSTER_MOB_RATE = 10;
// → VIP 1개 = 190 × 10 = 1,900마리분

/** 30분 순수 사냥 경험치 (부스터 제외, 배율 적용 전) */
export function getHunt30MinExp(inputs: InputValues): number {
  return getHuntingExpCore(inputs.charLevel, getMobs(inputs)) * 240;
}

/** 30분 사냥 기본 경험치 (배율 적용 전) */
export function getBase30MinExp(inputs: InputValues): number {
  const huntExp = getHunt30MinExp(inputs);
  const groundMobExp = getGroundMobExp(inputs);
  return (
    huntExp +
    groundMobExp * VIP_BOOSTER_MOB_RATE * BOOSTER_SPAWN_COUNT * inputs.booster30min
  );
}

/** N일 사냥 기본 경험치 (배율 적용 전). 기간만 다른 도핑 아이템들이 공유한다. */
export function getBaseDayExp(inputs: InputValues, days: number): number {
  // 사냥을 아예 안 하면(일 평균 재획 0) 부스터를 쓸 몹이 없으므로 기간 도핑 경험치도 0
  if (inputs.dailySessions <= 0) return 0;
  const mobs    = getMobs(inputs);
  const huntExp = getHuntingExpCore(inputs.charLevel, mobs) * 240 * inputs.dailySessions;
  const groundMobExp = getGroundMobExp(inputs);
  return (
    huntExp +
    groundMobExp * VIP_BOOSTER_MOB_RATE * BOOSTER_SPAWN_COUNT * inputs.booster1day
  ) * days;
}

/** 30일 사냥 기본 경험치 (배율 적용 전) */
export function getBase30DayExp(inputs: InputValues): number {
  return getBaseDayExp(inputs, 30);
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
  const sundayBonus = sunday === '일요일' ? 0.5 : sunday === '썬데이' ? 3.0 : 0;
  return base * (1 + sundayBonus + monsterParkBonus / 100);
}

/** 에픽 던전 데이터 조회 */
function getEpicDungeonTable(zone: EpicDungeonZone) {
  if (zone === '하이마운틴') return HAIMOUNTAIN;
  if (zone === '앵글러컴퍼니') return ANGLER_COMPANY;
  if (zone === '악몽선경') return NIGHTMARE_SANCTUARY;
  return AURUM_REGIS;
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

/** 메카베리 농장 사용 가능 최소 레벨 */
/** 정령의 펜던트 가격을 30일 기준으로 환산.
 *  90일권은 그대로 쓰면 30일 도핑 표에서 3배 비싸게 잡히므로 1/3로 나눈다.
 *  (마라벨 비용의 90/190 안분과 같은 맥락 — 기간이 다른 상품을 같은 잣대에 올린다) */
export function getJungpenPrice(inputs: InputValues): number {
  return inputs.priceJungpenMeso / ((inputs.jungpenDays ?? 30) / 30);
}

/** 정펜(메소) 항목명 — 어느 기간 가격을 넣었는지 이름에 드러낸다.
 *  가격은 위에서 30일 기준으로 환산되지만, 입력한 쪽이 30일인지 90일인지는 보여야 한다.
 *  ⚠️ 효율표(EfficiencyTab)와 가성비 순위(calcAllItems)가 같은 이름을 써야 같은 행으로 보인다. */
export function getJungpenMesoName(inputs: InputValues): string {
  return `정령의 펜던트(${inputs.jungpenDays ?? 30}일)(메소)`;
}

/** 정펜(메포)은 30일 고정 상품이라 기간이 바뀌지 않는다 — 메소 쪽과 나란히 보이도록 기간을 박아 둔다 */
export const JUNGPEN_MEPO_NAME = '정령의 펜던트(30일)(메포)';

export const MEKABERRY_MIN_LEVEL = 280;

/** 메카베리 농장 경험치 */
export function getMekaberryExp(charLevel: number): number {
  if (charLevel < MEKABERRY_MIN_LEVEL) return 0;
  return MEKABERRY_EXP[charLevel] ?? 0;
}

/** 크림슨 메카베리 농장 경험치 (메카베리와 동일하게 280 이상 전용) */
export function getCrimsonMekaberryExp(charLevel: number): number {
  if (charLevel < MEKABERRY_MIN_LEVEL) return 0;
  return CRIMSON_MEKABERRY_EXP[charLevel] ?? 0;
}

/** 블루베리 농장 경험치 */
export function getBlueberryExp(charLevel: number): number {
  return BLUEBERRY_EXP[charLevel] ?? 0;
}

/** 상급 EXP 쿠폰 1개당 경험치 */
export function getSuperExpCouponExp(charLevel: number): number {
  return SUPER_EXP_COUPON[charLevel] ?? 0;
}

// ─── 2026-11-18 판매 종료분 ───────────────────────────────────────────────────
// 프리미엄/프라임 모멘텀 패스와 수상한 돋보기·탐정예티의 수상한 돋보기가 함께 빠지면서
// 아래 계산들을 지웠다(커밋 이력에서 되살릴 수 있다):
//   getPassCoupon4xExp · getExpBonusMult · getVipBoosterExp · YETI_MAGNIFIER_MOB_RATE
//   getMagnifierExp · getYetiMagnifierExp
//   MomentumReward · PREMIUM/PRIME_MOMENTUM · getMomentumRewardExp
//   getPremium/PrimeMomentumExp · getPremium/PrimeMomentumPrice
//
// ⚠️ 이들의 구성품 계산이던 getCrimsonMekaberryExp · getSuperExpCouponExp는 남겨 뒀다 —
//    농장·교환권 데이터 조회 함수라 다음 패스류 상품이 나오면 그대로 다시 쓴다.
// ⚠️ inputs.expBonus(추가 경험치 획득량)를 쓰는 계산이 전부 사라져 정보 수정의 입력칸을
//    비활성화해 뒀다. 부스터류 상품이 다시 나오면 getExpBonusMult부터 되살린다.

/** 마스터라벨 성장 플러스 — 넥슨캐시 40,000원. 90일간 추가 경험치.
 *  계산은 30일 도핑과 동일한 공식에 기간만 90일을 적용한다. */
const MASTER_LABEL_PLUS_CASH = 40_000;
const MASTER_LABEL_PLUS_DAYS = 90;
/** 마스터라벨 본체의 사용 기간(일). 성장 플러스(90일)와 달라 값을 그대로 더할 수 없다. */
const MASTER_LABEL_DAYS = 190;

/** 마스터라벨 착용 부위 수별 추가 경험치 배율 (index = 착용 개수).
 *  유효 기간이 남은 마스터라벨을 착용한 개수만큼 차등 적용되며, 0개면 효과가 없다. */
const MASTER_LABEL_PLUS_RATES = [0, 0.25, 0.40, 0.55, 0.70, 1.00];
export const MASTER_LABEL_MAX = 5;

/** 착용 개수 → 배율 (범위를 벗어난 값은 0~5로 보정) */
export function getMasterLabelRate(count: number): number {
  const n = Math.min(Math.max(Math.floor(count) || 0, 0), MASTER_LABEL_MAX);
  return MASTER_LABEL_PLUS_RATES[n];
}

/** 마스터라벨 성장 플러스 총 경험치 = 90일 경험치 × 목표 부위 수의 배율.
 *  마스터라벨 자체는 경험치를 주지 않고 성장 플러스가 있어야 배율이 살아나므로, 이미 낀 라벨분도
 *  이번 구매로 비로소 얻는 경험치다. 목표가 0이면 0. */
export function getMasterLabelPlusExp(inputs: InputValues): number {
  return getBaseDayExp(inputs, MASTER_LABEL_PLUS_DAYS) * getMasterLabelRate(inputs.masterLabelCount);
}

/** 마스터라벨 성장 플러스 메소 가격 = 성장 플러스 + (선택) 마스터라벨 값.
 *
 *  라벨은 경험치 전용이 아니라 스펙 아이템이라, 그 값 중 얼마를 경험치 몫으로 볼지는 사람마다
 *  다르다. 그래서 기준을 우리가 정하지 않고 masterLabelCost로 받는다 — 0이면 기존처럼 성장
 *  플러스 값만, 넣으면 그만큼 얹힌다. 라벨을 이미 가진 사람은 비워두면 된다.
 *
 *  90/190을 곱하는 이유 — 190일치 값을 그대로 더하면 90일치 경험치에 190일치 비용을 물려
 *  약 2.11배 과대해진다. 성장 플러스와 같은 90일 기준으로 안분한다.
 *  (190일 기준으로 통일해도 분자·분모에 같은 배수가 붙어 가성비 비율은 동일하다.)
 *  ⚠️ 남은 사용 기간은 반영하지 않는다 — 효율표의 모든 항목이 "계속 재구매해 쓴다" 기준이라
 *     여기만 실제 잔여기간을 넣으면 같은 잣대로 비교할 수 없다. */
export function getMasterLabelPlusPrice(inputs: InputValues): number {
  return cashToMeso(MASTER_LABEL_PLUS_CASH, inputs.waterBottleRate)
    + inputs.masterLabelCost * (MASTER_LABEL_PLUS_DAYS / MASTER_LABEL_DAYS);
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

/** 30분 도핑 티어 3종(추경 70% / 경4쿠 / 고농축비)의 표시 행 계산 — 순위·효율표 공용.
 *  3배 쿠폰은 하위 티어인 2배 쿠폰이 판매 종료돼 비교 대상이 없으므로 티어가 아니라 단일 품목이다. */
export function getDoping30Tiers(inputs: InputValues, base30: number) {
  return {
    exp70:   tierRow('추가경험치 50%→70%', '추가경험치 70%', base30 * 0.5, inputs.price50,             base30 * 0.7, inputs.price70),
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
    item('3배 쿠폰',            '30분 도핑', base30 * 2,   inputs.price3x),
    tierItem(tiers.coupon4),
    item('소경축비',            '30분 도핑', base30 * 0.1, inputs.priceSmallBooster),
    tierItem(tiers.booster),
    // 30일 도핑
    item('부티크 사냥 칭호',           '30일 도핑', base30d * 1,    inputs.priceHunterTitle),
    item('혈맹의 반지(메소)',    '30일 도핑', base30d * 0.1,  inputs.priceBloodRingMeso),
    item('경험치 부스트링(메소)',       '30일 도핑', base30d * 0.15, inputs.priceBoostringMeso),
    item(getJungpenMesoName(inputs),      '30일 도핑', base30d * 0.3,  getJungpenPrice(inputs)),
    item('혈맹의 반지(메포)',    '30일 도핑', base30d * 0.1,  bloodRingMetaPrice),
    item('경험치 부스트링(메포)',       '30일 도핑', base30d * 0.15, boostringMetaPrice),
    item(JUNGPEN_MEPO_NAME,               '30일 도핑', base30d * 0.3,  jungpenMetaPrice),
    // BM
    item(`${epicName} 0→1단계`, 'BM', stage01Exp, stage01Price),
    item(`${epicName} 1→2단계`, 'BM', stage12Exp, stage12Price),
    item(`몬스터파크(${parkZone}) 평일·토`, 'BM', getMonsterParkExp(parkZone, '평일·토', monsterParkBonus), parkPrice),
    item(`몬스터파크(${parkZone}) 일요일`, 'BM', getMonsterParkExp(parkZone, '일요일', monsterParkBonus), parkPrice),
    item(`몬스터파크(${parkZone}) 썬데이`, 'BM', getMonsterParkExp(parkZone, '썬데이', monsterParkBonus), parkPrice),
    item('VIP 사우나',          'BM', vipExp, vipPrice),
    item('마스터라벨 성장 플러스', 'BM', getMasterLabelPlusExp(inputs), getMasterLabelPlusPrice(inputs)),
  ];

  return items.sort((a, b) => b.ratio - a.ratio);
}
