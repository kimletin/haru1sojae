import { MONSTER_EXP } from '@/data/monsterExp';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY, DUNGEON_METACOIN } from '@/data/epicDungeon';
import type { InputValues, EfficiencyItem, EpicDungeonZone, SundayType } from '@/types';

/** 캐릭터 레벨 - 몬스터 레벨 차이에 따른 경험치 배율 */
export function getExpMultiplier(charLevel: number, monsterLevel: number): number {
  const diff = charLevel - monsterLevel;
  if (diff >= 40) return 0.70;
  if (diff >= 21) return (diff + 50) / 100;
  if (diff >= 19) return 0.95;
  if (diff >= 17) return 0.96;
  if (diff >= 15) return 0.97;
  if (diff >= 13) return 0.98;
  if (diff >= 11) return 0.99;
  if (diff === 10) return 1.00;
  if (diff >= 5)  return 1.05;
  if (diff >= 2)  return 1.10;
  if (diff >= -1) return 1.20;
  if (diff >= -4) return 1.10;
  if (diff >= -9) return 1.05;
  if (diff >= -20) return (110 + diff) / 100;
  if (diff >= -35) return (diff * 4 + 154) / 100;
  if (diff >= -39) return 0.10;
  return 0;
}

/** 메포 가격 → 메소 환산 */
export function mepoToMeso(mepo: number, mesoMarketRate: number): number {
  return mepo / 0.99 / mesoMarketRate * 100_000_000;
}

/** 30분 사냥 기본 경험치 (배율 적용 전) */
export function getBase30MinExp(inputs: InputValues): number {
  const monsterExp = MONSTER_EXP[inputs.monsterLevel] ?? 0;
  const expMult = getExpMultiplier(inputs.charLevel, inputs.monsterLevel);
  return (
    monsterExp * expMult * inputs.mobCount * 240 +
    monsterExp * 10 * 190 * inputs.booster30min +
    monsterExp * 200 * 190 * inputs.eternal30min
  );
}

/** 30일 사냥 기본 경험치 (배율 적용 전) */
export function getBase30DayExp(inputs: InputValues): number {
  const monsterExp = MONSTER_EXP[inputs.monsterLevel] ?? 0;
  const expMult = getExpMultiplier(inputs.charLevel, inputs.monsterLevel);
  return (
    monsterExp * expMult * inputs.mobCount * 240 * inputs.dailySessions +
    monsterExp * 10 * 190 * inputs.booster1day +
    monsterExp * 200 * 190 * inputs.eternal1day
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
  charLevel: number,
  sunday: SundayType,
  boosterRate: number
): number {
  const zone = getMonsterParkZone(charLevel);
  const base = MONSTER_PARK_EXP[zone] ?? 0;
  const sundayBonus = sunday === '기본' ? 0.5 : sunday === '스페셜' ? 3 : 0;
  const boosterBonus = boosterRate;
  return base * (1 + sundayBonus + boosterBonus);
}

/** 에픽 던전 데이터 조회 */
function getEpicDungeonTable(zone: EpicDungeonZone) {
  if (zone === '하이마운틴') return HAIMOUNTAIN;
  if (zone === '앵컴') return ANGLER_COMPANY;
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

/** 에픽 던전 메소 가격 (0→1) */
export function getEpicDungeonStage01Price(zone: EpicDungeonZone, mesoMarketRate: number): number {
  const metacoin = DUNGEON_METACOIN[zone]?.stage1 ?? 0;
  return mepoToMeso(metacoin, mesoMarketRate) - 40_000_000 * 4;
}

/** 에픽 던전 메소 가격 (1→2) */
export function getEpicDungeonStage12Price(zone: EpicDungeonZone, mesoMarketRate: number): number {
  const metacoin = DUNGEON_METACOIN[zone]?.stage2 ?? 0;
  return mepoToMeso(metacoin, mesoMarketRate) - 40_000_000 * 4;
}

/** 악몽의 메아리 경험치 */
export function getEchoExp(monsterLevel: number): number {
  const monsterExp = MONSTER_EXP[monsterLevel] ?? 0;
  return monsterExp * 470 * 190;
}

/** 메카베리 농장 경험치 */
export function getMekaberryExp(charLevel: number): number {
  return MEKABERRY_EXP[charLevel] ?? 0;
}

/** 전체 가성비 아이템 목록 계산 */
export function calcAllItems(inputs: InputValues): EfficiencyItem[] {
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

  const { epicDungeonZone, charLevel, monsterLevel, mesoMarketRate, sunday, boosterRate } = inputs;
  const epicName = epicDungeonZone === '앵컴' ? '앵글러컴퍼니' : epicDungeonZone;

  const stage01Exp   = getEpicDungeonStage01Exp(epicDungeonZone, charLevel);
  const stage12Exp   = getEpicDungeonStage12Exp(epicDungeonZone, charLevel);
  const stage01Price = getEpicDungeonStage01Price(epicDungeonZone, mesoMarketRate);
  const stage12Price = getEpicDungeonStage12Price(epicDungeonZone, mesoMarketRate);

  const parkExp   = getMonsterParkExp(charLevel, sunday, boosterRate);
  const parkZone  = getMonsterParkZone(charLevel);
  const parkPrice = mepoToMeso(600, mesoMarketRate);

  const vipExp   = getVipSaunaExp(charLevel);
  const vipPrice = getVipSaunaPrice(mesoMarketRate);

  const mekExp   = getMekaberryExp(charLevel);
  const mekPrice = mepoToMeso(10000, mesoMarketRate);

  const echoExp   = getEchoExp(monsterLevel);
  const echoPrice = inputs.priceEcho;

  // 혈맹의 반지/부스트링/정펜 메포 가격
  const bloodRingMetaPrice = mepoToMeso(5900, mesoMarketRate);
  const boostringMetaPrice = mepoToMeso(29900, mesoMarketRate);
  const jungpenMetaPrice   = mepoToMeso(49900, mesoMarketRate);

  const items: EfficiencyItem[] = [
    // 30분 도핑
    item('추가 경험치 50%',     '30분 도핑', base30 * 0.5, inputs.price50),
    item('2배 쿠폰',            '30분 도핑', base30 * 1,   inputs.price2x),
    item('3배 쿠폰',            '30분 도핑', base30 * 2,   inputs.price3x),
    item('4배 쿠폰',            '30분 도핑', base30 * 3,   inputs.price4x),
    item('소경축비',            '30분 도핑', base30 * 0.1, inputs.priceSmallBooster),
    item('아즈모스 영약',       '30분 도핑', base30 * 0.2, inputs.priceAzmos),
    // 30일 도핑
    item('사냥 칭호',           '30일 도핑', base30d * 1,    inputs.priceHunterTitle),
    item('혈맹의 반지(메소)',    '30일 도핑', base30d * 0.1,  inputs.priceBloodRingMeso),
    item('부스트링(메소)',       '30일 도핑', base30d * 0.15, inputs.priceBoostringMeso),
    item('정펜(메소)',           '30일 도핑', base30d * 0.3,  inputs.priceJungpenMeso),
    item('혈맹의 반지(메포)',    '30일 도핑', base30d * 0.1,  bloodRingMetaPrice),
    item('부스트링(메포)',       '30일 도핑', base30d * 0.15, boostringMetaPrice),
    item('정펜(메포)',           '30일 도핑', base30d * 0.3,  jungpenMetaPrice),
    // BM
    item(`${epicName} 0→1단계`, 'BM', stage01Exp, stage01Price),
    item(`${epicName} 1→2단계`, 'BM', stage12Exp, stage12Price),
    item(`몬스터파크(${parkZone})`, 'BM', parkExp, parkPrice),
    item('VIP 사우나',          'BM', vipExp, vipPrice),
    ...(mekExp > 0 ? [item('메카베리 농장 입장권', 'BM', mekExp, mekPrice)] : []),
    item('악몽의 메아리',        'BM', echoExp, echoPrice),
    // 마진 비교
    item('추가경험치 50%→70%',  '마진', base30 * 0.2, inputs.price70 - inputs.price50),
    item('소경축비→고농축비',   '마진', base30 * 0.1, inputs.priceLargeBooster - inputs.priceSmallBooster),
  ];

  return items.sort((a, b) => b.ratio - a.ratio);
}
