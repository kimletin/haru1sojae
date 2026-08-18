// 경험치 콘텐츠 시뮬레이터 계산 (순수 함수) — ExpContentsTab에서 분리.
import { LEVEL_EXP } from '@/data/levelExp';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { BLUEBERRY_EXP } from '@/data/blueberry';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';

// ─── Simulator helpers ────────────────────────────────────────────────────────


export function calcLevelUp(startLevel: number, startExpPct: number, gainedExp: number, beyond = false) {
  if (!LEVEL_EXP[startLevel]) return null;
  const required = LEVEL_EXP[startLevel].required;
  let absExp = (startExpPct / 100) * required;
  let remaining = gainedExp;
  let lv = startLevel;
  while (remaining > 0) {
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!lvReq) break;
    const needed = lvReq - absExp;
    if (remaining >= needed) { remaining -= needed; lv += beyondJump(lv, beyond); absExp = 0; }
    else { absExp += remaining; remaining = 0; }
  }
  const finalReq = LEVEL_EXP[lv]?.required;
  return { finalLevel: lv, finalPct: finalReq ? (absExp / finalReq) * 100 : 0 };
}

function beyondJump(lv: number, beyond: boolean) {
  return beyond && lv <= 278 ? 2 : 1;
}

export function calcVipSaunaByTime(startLevel: number, startExpPct: number, totalSeconds: number, beyond: boolean) {
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let remainingTicks = Math.floor(totalSeconds / 5);
  let totalGained = 0;
  while (remainingTicks > 0) {
    const hourExp = VIP_SAUNA_EXP[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!lvReq || !hourExp) break;
    const tickExp = hourExp / 720;
    const expToNext = lvReq - absExp;
    const ticksNeeded = Math.ceil(expToNext / tickExp);
    if (ticksNeeded <= remainingTicks) {
      totalGained += expToNext;
      remainingTicks -= ticksNeeded;
      lv += beyondJump(lv, beyond);
      absExp = 0;
      if (!LEVEL_EXP[lv]) break;
    } else {
      const gained = remainingTicks * tickExp;
      totalGained += gained;
      absExp += gained;
      remainingTicks = 0;
    }
  }
  const finalReq = LEVEL_EXP[lv]?.required;
  return { finalLevel: lv, finalPct: finalReq ? (absExp / finalReq) * 100 : 0, gainedExp: Math.round(totalGained) };
}

export function calcVipSaunaByTarget(startLevel: number, startExpPct: number, targetLevel: number, beyond: boolean) {
  if (targetLevel <= startLevel) return null;
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let totalTicks = 0;
  let totalGained = 0;
  while (lv < targetLevel) {
    const hourExp = VIP_SAUNA_EXP[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!lvReq || !hourExp) break;
    const tickExp = hourExp / 720;
    const expToNext = lvReq - absExp;
    const ticksNeeded = Math.ceil(expToNext / tickExp);
    totalTicks += ticksNeeded;
    const actualExp = ticksNeeded * tickExp;
    totalGained += actualExp;
    absExp = actualExp - expToNext;
    lv += beyondJump(lv, beyond);
  }
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const totalSeconds = totalTicks * 5;
  const gainPct = (lv - startLevel) * 100 + finalPct - startExpPct;
  return { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor((totalSeconds % 3600) / 60), seconds: totalSeconds % 60, gainedExp: Math.round(totalGained), gainPct, finalLevel: lv, finalPct };
}

// 메카베리 계열(일반/크림슨)은 계산이 동일하고 레벨별 경험치 테이블만 다르다 → expTable로 주입
export function calcMekaberryByCount(startLevel: number, startExpPct: number, count: number, expTable: Record<number, number> = MEKABERRY_EXP) {
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let remaining = count;
  let levelsGained = 0;
  let totalGained = -absExp;
  while (remaining > 0) {
    const mekaExp = expTable[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!mekaExp || !lvReq) break;
    const expToNext = lvReq - absExp;
    const countNeeded = Math.ceil(expToNext / mekaExp);
    if (remaining >= countNeeded) {
      remaining -= countNeeded;
      totalGained += lvReq;
      const lastExpToNext = expToNext - (countNeeded - 1) * mekaExp;
      const progress = lastExpToNext / mekaExp;
      const nextLv = lv + 1;
      const nextMekaExp = expTable[nextLv] ?? mekaExp;
      absExp = (1 - progress) * nextMekaExp;
      lv = nextLv;
      levelsGained++;
    } else {
      absExp += remaining * mekaExp;
      remaining = 0;
    }
  }
  totalGained += absExp;
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const gainPct = levelsGained * 100 + finalPct - startExpPct;
  return { finalLevel: lv, finalPct, gainedExp: Math.round(totalGained), gainPct };
}

export function calcMekaberryByTarget(startLevel: number, startExpPct: number, targetLevel: number, expTable: Record<number, number> = MEKABERRY_EXP) {
  if (targetLevel <= startLevel) return null;
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let totalCount = 0;
  let levelsGained = 0;
  let totalGained = -absExp;
  while (lv < targetLevel) {
    const mekaExp = expTable[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!mekaExp || !lvReq) break;
    totalGained += lvReq;
    const expToNext = lvReq - absExp;
    const countNeeded = Math.ceil(expToNext / mekaExp);
    totalCount += countNeeded;
    const lastExpToNext = expToNext - (countNeeded - 1) * mekaExp;
    const progress = lastExpToNext / mekaExp;
    const nextLv = lv + 1;
    const nextMekaExp = expTable[nextLv] ?? mekaExp;
    absExp = (1 - progress) * nextMekaExp;
    lv = nextLv;
    levelsGained++;
  }
  totalGained += absExp;
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const gainPct = levelsGained * 100 + finalPct - startExpPct;
  return { count: totalCount, gainedExp: Math.round(totalGained), gainPct, finalLevel: lv, finalPct };
}

export function calcBlueberryByCount(startLevel: number, startExpPct: number, count: number, beyond: boolean) {
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let remaining = count;
  let totalGained = -absExp;
  while (remaining > 0) {
    const blueExp = BLUEBERRY_EXP[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!blueExp || !lvReq) break;
    const expToNext = lvReq - absExp;
    const countNeeded = Math.ceil(expToNext / blueExp);
    if (remaining >= countNeeded) {
      remaining -= countNeeded;
      totalGained += lvReq;
      const lastExpToNext = expToNext - (countNeeded - 1) * blueExp;
      const progress = lastExpToNext / blueExp;
      const nextLv = lv + beyondJump(lv, beyond);
      const nextBlueExp = BLUEBERRY_EXP[nextLv] ?? blueExp;
      absExp = (1 - progress) * nextBlueExp;
      lv = nextLv;
    } else {
      absExp += remaining * blueExp;
      remaining = 0;
    }
  }
  totalGained += absExp;
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const gainPct = (lv - startLevel) * 100 + finalPct - startExpPct;
  return { finalLevel: lv, finalPct, gainedExp: Math.round(totalGained), gainPct };
}

export function calcBlueberryByTarget(startLevel: number, startExpPct: number, targetLevel: number, beyond: boolean) {
  if (targetLevel <= startLevel) return null;
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let totalCount = 0;
  let totalGained = -absExp;
  while (lv < targetLevel) {
    const blueExp = BLUEBERRY_EXP[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!blueExp || !lvReq) break;
    totalGained += lvReq;
    const expToNext = lvReq - absExp;
    const countNeeded = Math.ceil(expToNext / blueExp);
    totalCount += countNeeded;
    const lastExpToNext = expToNext - (countNeeded - 1) * blueExp;
    const progress = lastExpToNext / blueExp;
    const nextLv = lv + beyondJump(lv, beyond);
    const nextBlueExp = BLUEBERRY_EXP[nextLv] ?? blueExp;
    absExp = (1 - progress) * nextBlueExp;
    lv = nextLv;
  }
  totalGained += absExp;
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const gainPct = (lv - startLevel) * 100 + finalPct - startExpPct;
  return { count: totalCount, gainedExp: Math.round(totalGained), gainPct, finalLevel: lv, finalPct };
}

// 누적 경험치 변환 (260레벨 기준) — 역산 시뮬레이터 공용
const REV_BASE_LEVEL = 260;
function cumExpOf(level: number, pct: number): number {
  let sum = 0;
  for (let l = REV_BASE_LEVEL; l < level; l++) sum += LEVEL_EXP[l]?.required ?? 0;
  sum += (pct / 100) * (LEVEL_EXP[level]?.required ?? 0);
  return sum;
}
// 목표에 정확히 도달하는 "가장 낮은 시작 레벨"과 그 경험치%를 찾음.
// 버닝비욘드는 레벨을 건너뛰어(278→280) 도달 위치가 시작에 대해 단조롭지 않으므로,
// 레벨을 낮은 쪽부터 스캔하고 각 레벨 내부에서만 이분탐색(레벨 내부는 단조)한다.
export function findStartForTarget(
  targetLevel: number,
  forward: (startLevel: number, startPct: number) => { finalLevel: number; finalPct: number },
): { startLevel: number; startPct: number } | null {
  const targetCum = cumExpOf(targetLevel, 0);
  const fcum = (L: number, p: number) => {
    const r = forward(L, p);
    return cumExpOf(r.finalLevel, r.finalPct);
  };
  for (let L = REV_BASE_LEVEL; L < targetLevel; L++) {
    if (!LEVEL_EXP[L]) continue;
    const f0 = fcum(L, 0);
    const fTop = fcum(L, 100 * (1 - 1e-12));
    if (f0 <= targetCum && targetCum <= fTop) {
      let lo = 0, hi = 100;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (fcum(L, mid) >= targetCum) hi = mid; else lo = mid;
      }
      return { startLevel: L, startPct: hi };
    }
  }
  return null;
}

// 역산 시뮬레이터 결과 (공용)
export type RevStartResult =
  | { ok: true; startLevel: number; startPct: number; targetLevel: number }
  | { ok: false; msg: string };

export function calcCouponByCount(startLevel: number, startExpPct: number, count: number, beyond: boolean) {
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let remaining = count;
  let totalGained = 0;
  while (remaining > 0) {
    const couponExp = SUPER_EXP_COUPON[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!couponExp || !lvReq) break;
    const expToNext = lvReq - absExp;
    const couponsNeeded = Math.ceil(expToNext / couponExp);
    if (remaining >= couponsNeeded) {
      remaining -= couponsNeeded;
      const actualExp = couponsNeeded * couponExp;
      totalGained += actualExp;
      absExp = actualExp - expToNext;
      lv += beyondJump(lv, beyond);
    } else {
      const gained = remaining * couponExp;
      totalGained += gained;
      absExp += gained;
      remaining = 0;
    }
  }
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const gainPct = (lv - startLevel) * 100 + finalPct - startExpPct;
  return { finalLevel: lv, finalPct, gainedExp: Math.round(totalGained), gainPct };
}

export function calcCouponByTarget(startLevel: number, startExpPct: number, targetLevel: number, beyond: boolean) {
  if (targetLevel <= startLevel) return null;
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let totalCount = 0;
  let totalGained = 0;
  while (lv < targetLevel) {
    const couponExp = SUPER_EXP_COUPON[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!couponExp || !lvReq) break;
    const expToNext = lvReq - absExp;
    const couponsNeeded = Math.ceil(expToNext / couponExp);
    totalCount += couponsNeeded;
    const actualExp = couponsNeeded * couponExp;
    totalGained += actualExp;
    absExp = actualExp - expToNext;
    lv += beyondJump(lv, beyond);
  }
  const finalReq = LEVEL_EXP[lv]?.required ?? 1;
  const finalPct = (absExp / finalReq) * 100;
  const gainPct = (lv - startLevel) * 100 + finalPct - startExpPct;
  return { count: totalCount, gainedExp: Math.round(totalGained), gainPct, finalLevel: lv, finalPct };
}
