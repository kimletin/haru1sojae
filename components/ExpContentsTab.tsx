'use client';

import { useRef, useEffect, useState } from 'react';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { BLUEBERRY_EXP } from '@/data/blueberry';
import { LEVEL_EXP } from '@/data/levelExp';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY } from '@/data/epicDungeon';
import { MONSTER_EXP } from '@/data/monsterExp';
import { TREASURE_MULTIPLIERS } from '@/data/treasureHunter';
import type { TreasureBox } from '@/data/treasureHunter';
import type { SundayType } from '@/types';
import Num from '@/components/Num';
import TooltipWrapper from '@/components/TooltipWrapper';

const LEVELS = Array.from({ length: 40 }, (_, i) => i + 260);

function pct(exp: number, level: number) {
  const req = LEVEL_EXP[level]?.required;
  if (!req) return '';
  return '+' + ((exp / req) * 100).toFixed(3) + '%';
}

// ─── SectionTable ────────────────────────────────────────────────────────────

interface SectionTableProps {
  title: string;
  headerColor: string;
  titleColor: string;
  rows: { level: number; value: number; isMe: boolean; badgeColor: string; textColor: string; rowBg: string }[];
  levelLabel: string;
  valueLabel?: string;
  className?: string;
}

function SectionTable({ title, headerColor, titleColor, rows, levelLabel, valueLabel = '경험치', className = '' }: SectionTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (activeRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const row = activeRef.current;
        const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
        container.scrollTop = offset;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [rows]);

  return (
    <div className={'bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col ' + className} style={{maxHeight:'664px'}}>
      <div className={'px-4 py-2.5 border-b shrink-0 ' + headerColor}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor}>{title}</h3>
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-scroll">
        <table className="table-fixed text-sm border-collapse w-full">
          <colgroup>
            <col style={{width:'50%'}} />
            <col style={{width:'50%'}} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
              <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold">{levelLabel}</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const subColor = row.isMe ? row.textColor : 'text-gray-400 dark:text-zinc-500';
              return (
                <tr
                  key={row.level}
                  ref={row.isMe ? activeRef : undefined}
                  className={'border-b ' + (row.isMe ? row.rowBg + ' font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
                >
                  <td className={'px-3 py-1.5 text-center ' + (row.isMe ? row.textColor : 'text-gray-700 dark:text-zinc-300')}>
                    {row.level}
                    {row.isMe && <span className={'ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full ' + row.badgeColor}>나</span>}
                  </td>
                  <td className={'px-3 py-1.5 text-center ' + (row.isMe ? row.textColor : 'text-gray-700 dark:text-zinc-300')}>
                    <Num n={row.value} />
                    <span className={'text-xs ml-1 ' + subColor}>({pct(row.value, row.level)})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DungeonTable ─────────────────────────────────────────────────────────────

interface BonusEntry { name: string; pct: number; }

interface DungeonTableProps {
  title: string;
  levels: number[];
  data: Record<number, { stage0: number; stage1: number; stage2: number }>;
  metacoin: { stage1: number; stage2: number };
  charLevel: number;
  headerColor: string;
  titleColor: string;
  badgeColor: string;
  rowBg: string;
  textColor: string;
  epicDungeonBonus: number;
  epicDungeonBonuses: BonusEntry[];
  scrollKey?: string;
}

type StageKey = 'stage0' | 'stage1' | 'stage2';

function DungeonTable({ title, levels, data, metacoin, charLevel, headerColor, titleColor, badgeColor, rowBg, textColor, epicDungeonBonus, epicDungeonBonuses, scrollKey }: DungeonTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ lv: number; stage: StageKey; x: number; y: number } | null>(null);
  const [epicBonusInput, setEpicBonusInput] = useState(epicDungeonBonus > 0 ? String(epicDungeonBonus) : '');

  useEffect(() => {
    setEpicBonusInput(epicDungeonBonus > 0 ? String(epicDungeonBonus) : '');
  }, [epicDungeonBonus]);

  const bonusPct = parseFloat(epicBonusInput) || 0;
  const hasBonus = bonusPct > 0 && epicDungeonBonuses.length > 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (activeRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const row = activeRef.current;
        const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
        container.scrollTop = offset;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [charLevel, scrollKey]);

  useEffect(() => {
    if (tooltip === null) return;
    const handler = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) setTooltip(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [tooltip]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={'px-4 py-2.5 border-b shrink-0 ' + headerColor}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor}>{title}</h3>
      </div>

      {tooltip !== null && hasBonus && (() => {
        const d = data[tooltip.lv];
        if (!d) return null;
        const baseExp = d[tooltip.stage];
        return (
          <div
            style={{ position: 'fixed', left: tooltip.x + 14, top: tooltip.y + 14 }}
            className="bg-gray-800 text-white text-[11px] rounded-lg px-2 py-1.5 z-50 pointer-events-none leading-relaxed flex flex-col items-center whitespace-nowrap"
          >
            <div className="text-gray-300 dark:text-zinc-400">기존 경험치: <Num n={baseExp} /></div>
            <div className="mt-1 flex flex-col items-center">
              {epicDungeonBonuses.map(b => (
                <div key={b.name}>{b.name} <span className="text-orange-300">(+{b.pct}%)</span></div>
              ))}
            </div>
          </div>
        );
      })()}


      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-scroll">
        <div ref={tableRef}>
          <table className="table-fixed text-sm border-collapse w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">레벨</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">0단계</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">1단계 ({metacoin.stage1.toLocaleString()}메포)</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">2단계 ({metacoin.stage2.toLocaleString()}메포)</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(lv => {
                const d = data[lv];
                if (!d) return null;
                const isMe = lv === charLevel;
                const baseColor = isMe ? textColor : 'text-gray-700 dark:text-zinc-300';
                const subColor  = isMe ? textColor : 'text-gray-400 dark:text-zinc-500';

                const bonusAmt = Math.round(d.stage0 * bonusPct / 100);
                const s0 = d.stage0 + bonusAmt;
                const s1 = d.stage1 + bonusAmt;
                const s2 = d.stage2 + bonusAmt;

                const cellClass = (base: string) =>
                  'px-4 py-1.5 text-center ' + base + (hasBonus ? ' cursor-pointer' : '');

                const makeHandlers = (stage: StageKey) => hasBonus ? {
                  onMouseEnter: (e: React.MouseEvent) => setTooltip({ lv, stage, x: e.clientX, y: e.clientY }),
                  onMouseLeave: () => setTooltip(null),
                } : { onMouseLeave: () => setTooltip(null) };

                return (
                  <tr
                    key={lv}
                    ref={isMe ? activeRef : undefined}
                    className={'border-b ' + (isMe ? rowBg + ' font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
                  >
                    <td className={'px-4 py-1.5 text-center whitespace-nowrap ' + baseColor}>
                      {lv}
                      {isMe && <span className={'ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full ' + badgeColor}>나</span>}
                    </td>
                    <td className={cellClass(baseColor)} {...makeHandlers('stage0')}>
                      <Num n={s0} />
                      <span className={'text-xs ml-1 ' + subColor}>({pct(s0, lv)})</span>
                    </td>
                    <td className={cellClass(baseColor)} {...makeHandlers('stage1')}>
                      <Num n={s1} />
                      <span className={'text-xs ml-1 ' + subColor}>({pct(s1, lv)})</span>
                    </td>
                    <td className={cellClass(baseColor)} {...makeHandlers('stage2')}>
                      <Num n={s2} />
                      <span className={'text-xs ml-1 ' + subColor}>({pct(s2, lv)})</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="px-4 py-2 flex items-center justify-end border-t border-gray-100 dark:border-zinc-700 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-zinc-400">보약</span>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              value={epicBonusInput}
              onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); const n = parseInt(v); setEpicBonusInput(v === '' ? '' : String(Math.min(n, 200))); }}
              className="w-14 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[22px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
              placeholder="0"
            />
            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DUNGEONS = [
  { name: '하이마운틴',   minLv: 260, data: HAIMOUNTAIN,        metacoin: { stage1: 7500,  stage2: 22500 } },
  { name: '앵글러컴퍼니', minLv: 270, data: ANGLER_COMPANY,     metacoin: { stage1: 10000, stage2: 30000 } },
  { name: '악몽선경',     minLv: 280, data: NIGHTMARE_SANCTUARY, metacoin: { stage1: 12500, stage2: 37500 } },
];

// ─── Simulator helpers ────────────────────────────────────────────────────────


function calcLevelUp(startLevel: number, startExpPct: number, gainedExp: number, beyond = false) {
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

function calcVipSaunaByTime(startLevel: number, startExpPct: number, totalSeconds: number, beyond: boolean) {
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

function calcVipSaunaByTarget(startLevel: number, startExpPct: number, targetLevel: number, beyond: boolean) {
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

function calcMekaberryByCount(startLevel: number, startExpPct: number, count: number) {
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let remaining = count;
  let levelsGained = 0;
  let totalGained = -absExp;
  while (remaining > 0) {
    const mekaExp = MEKABERRY_EXP[lv];
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
      const nextMekaExp = MEKABERRY_EXP[nextLv] ?? mekaExp;
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

function calcMekaberryByTarget(startLevel: number, startExpPct: number, targetLevel: number) {
  if (targetLevel <= startLevel) return null;
  let lv = startLevel;
  let absExp = (startExpPct / 100) * (LEVEL_EXP[lv]?.required ?? 0);
  let totalCount = 0;
  let levelsGained = 0;
  let totalGained = -absExp;
  while (lv < targetLevel) {
    const mekaExp = MEKABERRY_EXP[lv];
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!mekaExp || !lvReq) break;
    totalGained += lvReq;
    const expToNext = lvReq - absExp;
    const countNeeded = Math.ceil(expToNext / mekaExp);
    totalCount += countNeeded;
    const lastExpToNext = expToNext - (countNeeded - 1) * mekaExp;
    const progress = lastExpToNext / mekaExp;
    const nextLv = lv + 1;
    const nextMekaExp = MEKABERRY_EXP[nextLv] ?? mekaExp;
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

function calcBlueberryByCount(startLevel: number, startExpPct: number, count: number, beyond: boolean) {
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

function calcBlueberryByTarget(startLevel: number, startExpPct: number, targetLevel: number, beyond: boolean) {
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
function findStartForTarget(
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
type RevStartResult =
  | { ok: true; startLevel: number; startPct: number; targetLevel: number }
  | { ok: false; msg: string };

function calcCouponByCount(startLevel: number, startExpPct: number, count: number, beyond: boolean) {
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

function calcCouponByTarget(startLevel: number, startExpPct: number, targetLevel: number, beyond: boolean) {
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

const MENU_ITEMS = [
  { key: 'epicdungeon', label: '에픽 던전' },
  { key: 'monsterpark', label: '몬스터파크' },
  { key: 'vipsauna',    label: 'VIP 사우나' },
  { key: 'expcoupon',   label: '상급\nEXP 쿠폰' },
  { key: 'blueberry',   label: '블루베리\n농장' },
  { key: 'mekaberry',   label: '메카베리\n농장' },
  { key: 'treasurehunter', label: '트레져 헌터' },
];

// 경험치 콘텐츠 서브탭 키 (URL 검증용)
export const CONTENT_KEYS = MENU_ITEMS.map(m => m.key);


// ─── TreasureHunterTable ──────────────────────────────────────────────────────

const TREASURE_LEVELS = Array.from({ length: 40 }, (_, i) => i + 260);
const TREASURE_BOXES: TreasureBox[] = ['폴로/프리토', '에스페시아'];
const TREASURE_BOX_META: Record<TreasureBox, { label: string; sub: string }> = {
  '폴로/프리토': { label: '골드 트레져 박스', sub: '폴로/프리토' },
  '에스페시아':  { label: '다이아 트레져 박스', sub: '에스페시아' },
};

function TreasureHunterTable({ monsterLevel, charLevel, treasureBonus = 0, treasureBonuses = [], selectedBox }: {
  monsterLevel: number; charLevel: number; treasureBonus?: number; treasureBonuses?: BonusEntry[]; selectedBox: TreasureBox;
}) {
  const [bonusInput, setBonusInput] = useState(treasureBonus > 0 ? String(treasureBonus) : '');
  const [sunday, setSunday] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    setBonusInput(treasureBonus > 0 ? String(treasureBonus) : '');
  }, [treasureBonus]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (activeRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const row = activeRef.current;
        const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
        container.scrollTop = offset;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [monsterLevel, selectedBox]);

  const mult = TREASURE_MULTIPLIERS[selectedBox];
  const bonusPct = parseFloat(bonusInput) || 0;
  const sundayMult = sunday ? 3 : 1;

  const calc = (lv: number, baseMult: number) => {
    const base = (MONSTER_EXP[lv] ?? 0) * baseMult;
    return Math.round(base * (1 + bonusPct / 100) * sundayMult);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">{TREASURE_BOX_META[selectedBox].label}</h3>
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-scroll">
        <table className="table-fixed text-sm border-collapse w-full">
          <colgroup>
            <col style={{width:'16%'}} />
            <col style={{width:'21%'}} />
            <col style={{width:'21%'}} />
            <col style={{width:'21%'}} />
            <col style={{width:'21%'}} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
              <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">몬스터 레벨</th>
              <th className="text-center px-2 py-2 text-blue-500 font-bold">레어</th>
              <th className="text-center px-2 py-2 text-purple-500 font-bold">에픽</th>
              <th className="text-center px-2 py-2 text-yellow-500 font-bold">유니크</th>
              <th className="text-center px-2 py-2 text-green-500 font-bold">레전드리</th>
            </tr>
          </thead>
          <tbody>
            {TREASURE_LEVELS.map(lv => {
              const isMe = lv === monsterLevel;
              const baseColor = isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300';
              const subColor  = isMe ? 'text-orange-400' : 'text-gray-400 dark:text-zinc-500';
              const rare = calc(lv, mult.rare);
              const epic = calc(lv, mult.epic);
              const unique = calc(lv, mult.unique);
              const legendary = calc(lv, mult.legendary);
              return (
                <tr
                  key={lv}
                  ref={isMe ? activeRef : undefined}
                  className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
                >
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    {lv}
                    {isMe && <span className="ml-1 text-[9px] bg-orange-500 dark:bg-orange-700 text-white px-1 py-0.5 rounded-full">나</span>}
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    <Num n={rare} />
                    <span className={'text-xs ml-1 ' + subColor}>({pct(rare, charLevel)})</span>
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    <Num n={epic} />
                    <span className={'text-xs ml-1 ' + subColor}>({pct(epic, charLevel)})</span>
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    <Num n={unique} />
                    <span className={'text-xs ml-1 ' + subColor}>({pct(unique, charLevel)})</span>
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    <Num n={legendary} />
                    <span className={'text-xs ml-1 ' + subColor}>({pct(legendary, charLevel)})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-zinc-700 shrink-0">
        <TooltipWrapper tip="+200%">
          <button
            onClick={() => setSunday(s => !s)}
            className={`text-xs px-2 py-0.5 rounded border cursor-pointer transition-colors ${sunday ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
          >
            썬데이
          </button>
        </TooltipWrapper>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-zinc-400">보약</span>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              value={bonusInput}
              onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); const n = parseInt(v); setBonusInput(v === '' ? '' : String(Math.min(n, 200))); }}
              className="w-14 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[22px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
              placeholder="0"
            />
            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  charLevel: number;
  monsterLevel: number;
  monsterParkBonus: number;
  epicDungeonBonus?: number;
  epicDungeonBonuses?: BonusEntry[];
  treasureBonus?: number;
  treasureBonuses?: BonusEntry[];
  todayExpRate?: number | null;
  slotKey?: number;
  initialSelected?: string;
}

const SUNDAY_MULT: Record<SundayType, number> = { '일반': 1, '썬데이': 1.5, '스페셜': 4 };

export default function ExpContentsTab({ charLevel, monsterLevel, monsterParkBonus, epicDungeonBonus = 0, epicDungeonBonuses = [], treasureBonus = 0, treasureBonuses = [], todayExpRate, slotKey, initialSelected }: Props) {
  const myParkZone = getMonsterParkZone(charLevel);

  const [selected, setSelected] = useState(initialSelected ?? 'epicdungeon');

  useEffect(() => {
    window.history.replaceState({}, '', '/cont');
  }, []);


  // 시뮬레이터 state
  const [simLevel, setSimLevel] = useState(String(charLevel));
  const [simExpPct, setSimExpPct] = useState('');
  const [simPotionBuff, setSimPotionBuff] = useState('');
  const [simBeyond, setSimBeyond] = useState(false);
  const [simRounds, setSimRounds] = useState(7);
  const [simSunday, setSimSunday] = useState<SundayType>('일반');
  const [simResult, setSimResult] = useState<{ gainedExp: number; gainPct: number; finalLevel: number; finalPct: number } | null>(null);

  // VIP 사우나 시뮬레이터 state
  const [vipSimLevel, setVipSimLevel] = useState(String(charLevel));
  const [vipSimExpPct, setVipSimExpPct] = useState('');
  const [vipSimBeyond, setVipSimBeyond] = useState(false);
  const [vipSimMode, setVipSimMode] = useState<'목표' | '시간'>('시간');
  const [vipSimTarget, setVipSimTarget] = useState('');
  const [vipSimHours, setVipSimHours] = useState('');
  const [vipSimMinutes, setVipSimMinutes] = useState('');
  type VipSimResult =
    | { type: '시간'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
    | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; hours: number; minutes: number; seconds: number };
  const [vipSimResult, setVipSimResult] = useState<VipSimResult | null>(null);

  // VIP 사우나 역산 시뮬레이터 state
  const [vipRevTarget, setVipRevTarget] = useState('');
  const [vipRevHours, setVipRevHours] = useState('');
  const [vipRevMinutes, setVipRevMinutes] = useState('');
  const [vipRevBeyond, setVipRevBeyond] = useState(false);
  const [vipRevResult, setVipRevResult] = useState<RevStartResult | null>(null);

  const [couponSimLevel, setCouponSimLevel] = useState(String(charLevel));
  const [couponSimExpPct, setCouponSimExpPct] = useState('');
  const [couponSimBeyond, setCouponSimBeyond] = useState(false);
  const [couponSimMode, setCouponSimMode] = useState<'개수' | '목표'>('개수');
  const [couponSimCount, setCouponSimCount] = useState('');
  const [couponSimTarget, setCouponSimTarget] = useState('');
  type CouponSimResult =
    | { type: '개수'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
    | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; count: number };
  const [couponSimResult, setCouponSimResult] = useState<CouponSimResult | null>(null);

  // 상급 경험치 쿠폰 역산 시뮬레이터 state
  const [couponRevTarget, setCouponRevTarget] = useState('');
  const [couponRevCount, setCouponRevCount] = useState('');
  const [couponRevBeyond, setCouponRevBeyond] = useState(false);
  const [couponRevResult, setCouponRevResult] = useState<RevStartResult | null>(null);

  // 메카베리 농장 시뮬레이터 state
  const [mekaSimLevel, setMekaSimLevel] = useState(String(charLevel));
  const [mekaSimExpPct, setMekaSimExpPct] = useState('');
  const [mekaSimMode, setMekaSimMode] = useState<'개수' | '목표'>('개수');
  const [mekaSimCount, setMekaSimCount] = useState('');
  const [mekaSimTarget, setMekaSimTarget] = useState('');
  type MekaSimResult =
    | { type: '개수'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
    | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; count: number };
  const [mekaSimResult, setMekaSimResult] = useState<MekaSimResult | null>(null);

  // 메카베리 역산 시뮬레이터 state
  const [mekaRevTarget, setMekaRevTarget] = useState('');
  const [mekaRevCount, setMekaRevCount] = useState('');
  const [mekaRevResult, setMekaRevResult] = useState<RevStartResult | null>(null);

  // 트레져 헌터 던전 선택
  const [treasureBox, setTreasureBox] = useState<TreasureBox>('폴로/프리토');

  // 몬스터파크 보약 체크박스
  const [parkBonusInput, setParkBonusInput] = useState(monsterParkBonus > 0 ? String(monsterParkBonus) : '');

  // 몬스터파크 썬데이메이플
  const [sundayType, setSundayType] = useState<SundayType>('일반');

  // 블루베리 농장 시뮬레이터 state
  const [blueSimLevel, setBlueSimLevel] = useState(String(charLevel));
  const [blueSimExpPct, setBlueSimExpPct] = useState('');
  const [blueSimBeyond, setBlueSimBeyond] = useState(false);
  const [blueSimMode, setBlueSimMode] = useState<'개수' | '목표'>('개수');
  const [blueSimCount, setBlueSimCount] = useState('');
  const [blueSimTarget, setBlueSimTarget] = useState('');
  type BlueSimResult =
    | { type: '개수'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
    | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; count: number };
  const [blueSimResult, setBlueSimResult] = useState<BlueSimResult | null>(null);

  // 블루베리 역산(목표 레벨 -> 시작 시점) 시뮬레이터 state
  const [blueRevTarget, setBlueRevTarget] = useState('');
  const [blueRevCount, setBlueRevCount] = useState('');
  const [blueRevBeyond, setBlueRevBeyond] = useState(false);
  type BlueRevResult =
    | { ok: true; startLevel: number; startPct: number; targetLevel: number }
    | { ok: false; msg: string };
  const [blueRevResult, setBlueRevResult] = useState<BlueRevResult | null>(null);




  // CharacterCard 캐시에서 받아온 오늘 경험치 / 보약 자동 입력
  useEffect(() => {
    if (todayExpRate != null) {
      const v = todayExpRate.toFixed(3);
      setSimExpPct(v);
      setVipSimExpPct(v);
      setCouponSimExpPct(v);
      setMekaSimExpPct(v);
      setBlueSimExpPct(v);
    }
  }, [todayExpRate]);
  useEffect(() => {
    if (monsterParkBonus > 0) setSimPotionBuff(String(monsterParkBonus));
  }, [monsterParkBonus, slotKey]);
  useEffect(() => {
    setSimLevel(String(charLevel));
    setVipSimLevel(String(charLevel));
    setCouponSimLevel(String(charLevel));
    setMekaSimLevel(String(charLevel));
    setBlueSimLevel(String(charLevel));
    setSimResult(null);
    setVipSimResult(null);
    setCouponSimResult(null);
    setMekaSimResult(null);
    setBlueSimResult(null);
    setBlueRevResult(null);
    setMekaRevResult(null);
    setCouponRevResult(null);
    setVipRevResult(null);
  // slotKey가 바뀌면 charLevel이 같아도 강제 갱신
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotKey, charLevel]);

  useEffect(() => {
    setParkBonusInput(monsterParkBonus > 0 ? String(monsterParkBonus) : '');
  }, [monsterParkBonus, slotKey]);

  const handleSimCalc = () => {
    const lv = parseInt(simLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(simExpPct) || 0));
    const potionBuff = parseFloat(simPotionBuff) || 0;
    if (!LEVEL_EXP[lv]) return;
    const baseExp = MONSTER_PARK_EXP[getMonsterParkZone(lv)];
    if (!baseExp) return;
    const simSundayPct = (SUNDAY_MULT[simSunday] - 1) * 100;
    const totalBonusPct = potionBuff + simSundayPct;
    const expPerRound = Math.round(baseExp * (1 + totalBonusPct / 100));
    const totalGained = expPerRound * simRounds;
    const res = calcLevelUp(lv, expPct, totalGained, simBeyond);
    if (!res) return;
    const gainPct = (res.finalLevel - lv) * 100 + res.finalPct - expPct;
    setSimResult({ gainedExp: totalGained, gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
  };

  const handleVipSimCalc = () => {
    const lv = parseInt(vipSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(vipSimExpPct) || 0));
    if (!LEVEL_EXP[lv]) return;
    if (vipSimMode === '시간') {
      const hours = parseInt(vipSimHours) || 0;
      const minutes = parseInt(vipSimMinutes) || 0;
      const totalSeconds = hours * 3600 + minutes * 60;
      if (totalSeconds <= 0) return;
      const res = calcVipSaunaByTime(lv, expPct, totalSeconds, vipSimBeyond);
      const gainPct = (res.finalLevel - lv) * 100 + res.finalPct - expPct;
      setVipSimResult({ type: '시간', gainedExp: res.gainedExp, gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(vipSimTarget);
      if (!targetLv || targetLv <= lv || (targetLv < 300 && !LEVEL_EXP[targetLv])) return;
      const res = calcVipSaunaByTarget(lv, expPct, targetLv, vipSimBeyond);
      if (!res) return;
      setVipSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, hours: res.hours, minutes: res.minutes, seconds: res.seconds });
    }
  };

  const handleVipRevCalc = () => {
    const targetLv = parseInt(vipRevTarget);
    const hours = parseInt(vipRevHours) || 0;
    const minutes = parseInt(vipRevMinutes) || 0;
    const totalSeconds = hours * 3600 + minutes * 60;
    if (!targetLv || targetLv < 261 || targetLv > 300) return;
    if (totalSeconds <= 0) return;
    const res = findStartForTarget(targetLv, (sl, sp) => {
      const r = calcVipSaunaByTime(sl, sp, totalSeconds, vipRevBeyond);
      return { finalLevel: r.finalLevel, finalPct: r.finalPct };
    });
    if (!res) { setVipRevResult({ ok: false, msg: '시간이 너무 길어요 (260레벨 이전 필요)' }); return; }
    setVipRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
  };

  const handleCouponSimCalc = () => {
    const lv = parseInt(couponSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(couponSimExpPct) || 0));
    if (!LEVEL_EXP[lv]) return;
    if (couponSimMode === '개수') {
      const count = parseInt(couponSimCount);
      if (!count || count <= 0) return;
      const res = calcCouponByCount(lv, expPct, count, couponSimBeyond);
      setCouponSimResult({ type: '개수', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(couponSimTarget);
      if (!targetLv || targetLv <= lv || (targetLv < 300 && !LEVEL_EXP[targetLv])) return;
      const res = calcCouponByTarget(lv, expPct, targetLv, couponSimBeyond);
      if (!res) return;
      setCouponSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, count: res.count });
    }
  };

  const handleCouponRevCalc = () => {
    const targetLv = parseInt(couponRevTarget);
    const count = parseInt(couponRevCount);
    if (!targetLv || targetLv < 261 || targetLv > 300) return;
    if (!count || count < 1 || count > 99999) return;
    const res = findStartForTarget(targetLv, (sl, sp) => calcCouponByCount(sl, sp, count, couponRevBeyond));
    if (!res) { setCouponRevResult({ ok: false, msg: '재화가 너무 많아요 (260레벨 이전 필요)' }); return; }
    setCouponRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
  };

  const handleMekaSimCalc = () => {
    const lv = parseInt(mekaSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(mekaSimExpPct) || 0));
    if (!LEVEL_EXP[lv] || lv < 280 || lv > 299) return;
    if (mekaSimMode === '개수') {
      const count = parseInt(mekaSimCount);
      if (!count || count < 1 || count > 99) return;
      const res = calcMekaberryByCount(lv, expPct, count);
      setMekaSimResult({ type: '개수', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(mekaSimTarget);
      if (!targetLv || targetLv <= lv || targetLv > 300) return;
      const res = calcMekaberryByTarget(lv, expPct, targetLv);
      if (!res) return;
      setMekaSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, count: res.count });
    }
  };

  const handleMekaRevCalc = () => {
    const targetLv = parseInt(mekaRevTarget);
    const count = parseInt(mekaRevCount);
    if (!targetLv || targetLv < 281 || targetLv > 300) return;
    if (!count || count < 1 || count > 99) return;
    const res = findStartForTarget(targetLv, (sl, sp) => calcMekaberryByCount(sl, sp, count));
    if (!res) { setMekaRevResult({ ok: false, msg: '재화가 너무 많아요 (280레벨 이전 필요)' }); return; }
    setMekaRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
  };

  const handleBlueSimCalc = () => {
    const lv = parseInt(blueSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(blueSimExpPct) || 0));
    if (!LEVEL_EXP[lv] || lv < 260 || lv > 299) return;
    if (blueSimMode === '개수') {
      const count = parseInt(blueSimCount);
      if (!count || count < 1 || count > 99) return;
      const res = calcBlueberryByCount(lv, expPct, count, blueSimBeyond);
      setBlueSimResult({ type: '개수', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(blueSimTarget);
      if (!targetLv || targetLv <= lv || targetLv > 300) return;
      const res = calcBlueberryByTarget(lv, expPct, targetLv, blueSimBeyond);
      if (!res) return;
      setBlueSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, count: res.count });
    }
  };

  const handleBlueRevCalc = () => {
    const targetLv = parseInt(blueRevTarget);
    const count = parseInt(blueRevCount);
    if (!targetLv || targetLv < 261 || targetLv > 300) return;
    if (!count || count < 1 || count > 99) return;
    const res = findStartForTarget(targetLv, (sl, sp) => calcBlueberryByCount(sl, sp, count, blueRevBeyond));
    if (!res) { setBlueRevResult({ ok: false, msg: '재화가 너무 많아요 (260레벨 이전 필요)' }); return; }
    setBlueRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
  };

  const defaultDungeon =[...DUNGEONS].reverse().find(d => charLevel >= d.minLv)?.name ?? DUNGEONS[0].name;
  const [selectedDungeon, setSelectedDungeon] = useState(defaultDungeon);
  useEffect(() => {
    setSelectedDungeon([...DUNGEONS].reverse().find(d => charLevel >= d.minLv)?.name ?? DUNGEONS[0].name);
  }, [charLevel]);

  const dungeon = DUNGEONS.find(d => d.name === selectedDungeon) ?? DUNGEONS[0];
  const epicLevels = Array.from({ length: 40 }, (_, i) => i + 260).filter(lv => lv >= dungeon.minLv);

  const commonRowProps = {
    badgeColor: 'bg-orange-500 dark:bg-orange-700',
    textColor: 'text-orange-600',
    rowBg: 'bg-orange-50 dark:bg-orange-900/40',
  };

  const isEpic = selected === 'epicdungeon';

  return (
    <div className="flex gap-4 items-stretch">
      {/* 좌측 메뉴 */}
      <div className="grid grid-cols-1 gap-1.5 shrink-0 w-[90px] self-start">
        {MENU_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => setSelected(item.key)}
            className={
              'aspect-square rounded-lg text-sm font-medium transition-colors cursor-pointer flex flex-col items-center justify-center whitespace-pre-line text-center ' +
              (selected === item.key
                ? 'bg-orange-500 text-white border border-orange-500'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 우측 콘텐츠 */}
      <div className="flex flex-1 gap-4 items-stretch">
        {isEpic ? (
          /* 에픽 던전 — 전체 너비 사용 */
          <div className="flex-1 flex flex-col gap-1.5" style={{height:'664px'}}>
            <div className="flex gap-1.5 shrink-0">
              {DUNGEONS.map(d => (
                <button
                  key={d.name}
                  onClick={() => setSelectedDungeon(d.name)}
                  className={
                    'flex-1 rounded-lg text-sm font-medium transition-colors cursor-pointer py-2 px-3 flex flex-col items-center justify-center ' +
                    (selectedDungeon === d.name
                      ? 'bg-orange-500 text-white border border-orange-500'
                      : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
                  }
                >
                  <div className="font-semibold">{d.name}</div>
                  <div className={'text-xs mt-0.5 ' + (selectedDungeon === d.name ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
                    Lv.{d.minLv}~
                  </div>
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0">
              <DungeonTable
                title={dungeon.name}
                levels={epicLevels}
                data={dungeon.data}
                metacoin={dungeon.metacoin}
                charLevel={charLevel}
                headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                titleColor="text-gray-800 dark:text-zinc-100"
                badgeColor="bg-orange-500 dark:bg-orange-700"
                rowBg="bg-orange-50 dark:bg-orange-900/40"
                textColor="text-orange-600"
                epicDungeonBonus={epicDungeonBonus}
                epicDungeonBonuses={epicDungeonBonuses}
                scrollKey={selected + selectedDungeon}
              />
            </div>
          </div>
        ) : (
          <>
            {/* 좌측 카드 */}
            <div className="flex-1">
              {selected === 'monsterpark' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col" style={{maxHeight:'664px'}}>
                  <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
                    <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">몬스터파크</h3>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-scroll">
                    <div>
                      <table className="table-fixed w-full text-sm border-collapse">
                        <colgroup>
                          <col style={{width:'50%'}} />
                          <col style={{width:'50%'}} />
                        </colgroup>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                            <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold">지역</th>
                            <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold">경험치</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(MONSTER_PARK_EXP).map(([zone, baseExp]) => {
                            const sundayBonus = SUNDAY_MULT[sundayType] - 1;
                            const potionBonus = (parseFloat(parkBonusInput) || 0) / 100;
                            const exp = Math.round(baseExp * (1 + sundayBonus + potionBonus));
                            const isMe = zone === myParkZone;
                            const subColor = isMe ? 'text-orange-500' : 'text-gray-400 dark:text-zinc-500';
                            return (
                              <tr
                                key={zone}
                                className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
                              >
                                <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700' : 'text-gray-700 dark:text-zinc-300')}>
                                  {zone}
                                  {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                                </td>
                                <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700 font-bold' : 'text-gray-700 dark:text-zinc-300')}>
                                  <Num n={exp} />
                                  <span className={'text-xs ml-1 ' + subColor}>({pct(exp, charLevel)})</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-zinc-700 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">썬데이</span>
                      {([
                        { val: '일반',   tip: '+0%' },
                        { val: '썬데이', tip: '+50%' },
                        { val: '스페셜', tip: '+300%' },
                      ] as const).map(({ val, tip }) => (
                        <TooltipWrapper key={val} tip={tip}>
                          <button
                            onClick={() => setSundayType(val)}
                            className={`text-xs px-2 py-0.5 rounded border cursor-pointer transition-colors ${sundayType === val ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                          >
                            {val}
                          </button>
                        </TooltipWrapper>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">보약</span>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={parkBonusInput}
                          onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); const n = parseInt(v); setParkBonusInput(v === '' ? '' : String(Math.min(n, 200))); }}
                          className="w-14 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[22px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                          placeholder="0"
                        />
                        <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selected === 'vipsauna' && (
                <SectionTable
                  title="VIP 사우나"
                  valueLabel="1시간 당 경험치"
                  headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                  titleColor="text-gray-800 dark:text-zinc-100"
                  levelLabel="레벨"
                  className=""
                  rows={LEVELS.map(lv => ({ level: lv, value: VIP_SAUNA_EXP[lv] ?? 0, isMe: lv === charLevel, ...commonRowProps }))}
                />
              )}

              {selected === 'expcoupon' && (
                <SectionTable
                  title="상급 EXP 쿠폰"
                  valueLabel="1000개 당 경험치"
                  headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                  titleColor="text-gray-800 dark:text-zinc-100"
                  levelLabel="레벨"
                  className=""
                  rows={LEVELS.map(lv => ({ level: lv, value: (SUPER_EXP_COUPON[lv] ?? 0) * 1000, isMe: lv === charLevel, ...commonRowProps }))}
                />
              )}

              {selected === 'mekaberry' && (
                <SectionTable
                  title="메카베리 농장"
                  headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                  titleColor="text-gray-800 dark:text-zinc-100"
                  levelLabel="레벨"
                  className=""
                  rows={LEVELS.filter(lv => lv >= 280).map(lv => ({ level: lv, value: MEKABERRY_EXP[lv] ?? 0, isMe: lv === charLevel, ...commonRowProps }))}
                />
              )}

              {selected === 'blueberry' && (
                <SectionTable
                  title="블루베리 농장"
                  headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                  titleColor="text-gray-800 dark:text-zinc-100"
                  levelLabel="레벨"
                  className=""
                  rows={LEVELS.map(lv => ({ level: lv, value: BLUEBERRY_EXP[lv] ?? 0, isMe: lv === charLevel, ...commonRowProps }))}
                />
              )}

              {selected === 'treasurehunter' && (
                <div className="flex-1 flex flex-col gap-1.5" style={{height:'664px'}}>
                  <div className="flex gap-1.5 shrink-0">
                    {TREASURE_BOXES.map(d => (
                      <button
                        key={d}
                        onClick={() => setTreasureBox(d)}
                        className={
                          'flex-1 rounded-lg text-sm font-medium transition-colors cursor-pointer py-2 px-3 flex flex-col items-center justify-center ' +
                          (treasureBox === d
                            ? 'bg-orange-500 text-white border border-orange-500'
                            : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
                        }
                      >
                        <div className="font-semibold">{TREASURE_BOX_META[d].label}</div>
                        <div className={'text-xs mt-0.5 ' + (treasureBox === d ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>{TREASURE_BOX_META[d].sub}</div>
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 min-h-0">
                    <TreasureHunterTable
                      monsterLevel={monsterLevel}
                      charLevel={charLevel}
                      treasureBonus={treasureBonus}
                      treasureBonuses={treasureBonuses}
                      selectedBox={treasureBox}
                    />
                  </div>
                </div>
              )}

            </div>

            {/* 시뮬레이터 카드 */}
            {selected !== 'treasurehunter' && <div className="flex-1 self-start flex flex-col gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
                  <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">시뮬레이터</h3>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  {selected === 'vipsauna' && (<>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 잠수 시간(또는 목표 레벨)을 입력하면 도달 레벨을 계산합니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={vipSimLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="decimal" value={vipSimExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setVipSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                            placeholder="0.000" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setVipSimBeyond(v => !v)}
                          disabled={parseInt(vipSimLevel) >= 279}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                            (parseInt(vipSimLevel) >= 279
                              ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                              : 'cursor-pointer ' + (vipSimBeyond
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400'))}
                        >
                          버닝 BEYOND
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
                        <div className="flex gap-1">
                          {(['시간', '목표'] as const).map(m => (
                            <button key={m} onClick={() => { setVipSimMode(m); setVipSimResult(null); }}
                              className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                                (vipSimMode === m
                                  ? 'bg-orange-500 border-orange-500 text-white'
                                  : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      {vipSimMode === '목표' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={vipSimTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                          </div>
                        </div>
                      )}
                      {vipSimMode === '시간' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">잠수 시간</span>
                          <div className="flex items-center gap-1">
                            <div className="relative flex items-center">
                              <input type="text" inputMode="numeric" value={vipSimHours} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimHours(v); }} className="w-[60px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                                placeholder="0" />
                              <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">시간</span>
                            </div>
                            <div className="relative flex items-center">
                              <input type="text" inputMode="numeric" value={vipSimMinutes} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimMinutes(v); }} className="w-[44px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                                placeholder="0" />
                              <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">분</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const lv = parseInt(vipSimLevel);
                      const expPct = parseFloat(vipSimExpPct);
                      const target = parseInt(vipSimTarget);
                      const hours = parseInt(vipSimHours);
                      const minutes = parseInt(vipSimMinutes);
                      let reason: string | null = null;
                      if (vipSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
                      else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
                      else if (vipSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
                      else if (vipSimMode === '목표') {
                        if (vipSimTarget === '' || isNaN(target)) reason = '목표 레벨을 입력해주세요';
                        else if (target <= lv || target > 300) reason = '목표 레벨이 올바르지 않아요';
                      } else if (vipSimMode === '시간') {
                        if ((vipSimHours !== '' && (isNaN(hours) || hours < 0 || hours > 999)) || (vipSimMinutes !== '' && (isNaN(minutes) || minutes < 0 || minutes > 59))) reason = '시간이 올바르지 않아요';
                        else if ((hours || 0) === 0 && (minutes || 0) === 0) reason = '시간을 입력해주세요';
                      }
                      return (
                        <button onClick={handleVipSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      {vipSimMode === '목표' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">소요 시간</span>
                          {vipSimResult && vipSimResult.type === '목표'
                            ? <span className="font-bold text-gray-800 dark:text-zinc-100">{vipSimResult.hours > 0 ? `${vipSimResult.hours}시간 ` : ''}{vipSimResult.minutes > 0 ? `${vipSimResult.minutes}분 ` : ''}{vipSimResult.seconds > 0 ? `${vipSimResult.seconds}초` : (vipSimResult.hours === 0 && vipSimResult.minutes === 0 ? '0초' : '')}</span>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
                        <div className="text-right">
                          {vipSimResult
                            ? <><Num n={vipSimResult.gainedExp} className="font-bold text-orange-600 dark:text-orange-400" /><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{vipSimResult.gainPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">달성</span>
                        <div className="text-right">
                          {vipSimResult
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{vipSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{vipSimResult.finalPct.toFixed(3)}%</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                    </div>
                  </>)}
                  {selected === 'expcoupon' && (<>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 개수(또는 목표 레벨)를 입력하면 도달 레벨을 계산합니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={couponSimLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCouponSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="decimal" value={couponSimExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setCouponSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                            placeholder="0.000" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setCouponSimBeyond(v => !v)}
                          disabled={parseInt(couponSimLevel) >= 279}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                            (parseInt(couponSimLevel) >= 279
                              ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                              : 'cursor-pointer ' + (couponSimBeyond
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400'))}
                        >
                          버닝 BEYOND
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
                        <div className="flex gap-1">
                          {(['개수', '목표'] as const).map(m => (
                            <button key={m} onClick={() => { setCouponSimMode(m); setCouponSimResult(null); }}
                              className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                                (couponSimMode === m
                                  ? 'bg-orange-500 border-orange-500 text-white'
                                  : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      {couponSimMode === '개수' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">쿠폰 개수</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={couponSimCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCouponSimCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                          </div>
                        </div>
                      )}
                      {couponSimMode === '목표' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={couponSimTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCouponSimTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const lv = parseInt(couponSimLevel);
                      const expPct = parseFloat(couponSimExpPct);
                      const count = parseInt(couponSimCount);
                      const target = parseInt(couponSimTarget);
                      let reason: string | null = null;
                      if (couponSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
                      else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
                      else if (couponSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
                      else if (couponSimMode === '개수') {
                        if (couponSimCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
                        else if (count < 1 || count > 99999) reason = '개수가 올바르지 않아요';
                      } else if (couponSimMode === '목표') {
                        if (couponSimTarget === '' || isNaN(target)) reason = '목표 레벨을 입력해주세요';
                        else if (target <= lv || target > 300) reason = '목표 레벨이 올바르지 않아요';
                      }
                      return (
                        <button onClick={handleCouponSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      {couponSimMode === '목표' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">사용 개수</span>
                          {couponSimResult && couponSimResult.type === '목표'
                            ? <span className="font-bold text-gray-800 dark:text-zinc-100">{couponSimResult.count.toLocaleString()}개</span>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
                        <div className="text-right">
                          {couponSimResult
                            ? <><Num n={couponSimResult.gainedExp} className="font-bold text-orange-600 dark:text-orange-400" /><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{couponSimResult.gainPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">달성</span>
                        <div className="text-right">
                          {couponSimResult
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{couponSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{couponSimResult.finalPct.toFixed(3)}%</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                    </div>
                  </>)}
                  {selected === 'mekaberry' && (<>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 개수(또는 목표 레벨)를 입력하면 도달 레벨을 계산합니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={mekaSimLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="280" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="decimal" value={mekaSimExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setMekaSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                            placeholder="0.000" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
                        <div className="flex gap-1">
                          {(['개수', '목표'] as const).map(m => (
                            <button key={m} onClick={() => { setMekaSimMode(m); setMekaSimResult(null); }}
                              className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                                (mekaSimMode === m ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>{m}</button>
                          ))}
                        </div>
                      </div>
                      {mekaSimMode === '개수' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={mekaSimCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaSimCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                          </div>
                        </div>
                      )}
                      {mekaSimMode === '목표' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={mekaSimTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaSimTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const lv = parseInt(mekaSimLevel);
                      const expPct = parseFloat(mekaSimExpPct);
                      let reason: string | null = null;
                      if (mekaSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
                      else if (lv < 280 || lv > 299) reason = '레벨이 올바르지 않아요';
                      else if (mekaSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
                      else if (mekaSimMode === '개수') {
                        const count = parseInt(mekaSimCount);
                        if (mekaSimCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
                        else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
                      } else {
                        const targetLv = parseInt(mekaSimTarget);
                        if (mekaSimTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
                        else if (targetLv <= lv || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
                      }
                      return (
                        <button onClick={handleMekaSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      {mekaSimMode === '목표' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">필요 개수</span>
                          <div className="text-right">
                            {mekaSimResult && mekaSimResult.type === '목표'
                              ? <><span className="font-bold text-gray-800 dark:text-zinc-100">{mekaSimResult.count.toLocaleString()}</span><span className="ml-1 text-sm text-gray-500 dark:text-zinc-400">개</span></>
                              : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
                        <div className="text-right">
                          {mekaSimResult
                            ? <><Num n={mekaSimResult.gainedExp} className="font-bold text-orange-600 dark:text-orange-400" /><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{mekaSimResult.gainPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
                        <div className="text-right">
                          {mekaSimResult
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{mekaSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({mekaSimResult.finalPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                    </div>
                  </>)}
                  {selected === 'blueberry' && (<>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 개수(또는 목표 레벨)를 입력하면 도달 레벨을 계산합니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={blueSimLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setBlueSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="260" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="decimal" value={blueSimExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setBlueSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                            placeholder="0.000" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setBlueSimBeyond(v => !v)}
                          disabled={parseInt(blueSimLevel) >= 279}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ' +
                            (blueSimBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                          버닝 BEYOND
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
                        <div className="flex gap-1">
                          {(['개수', '목표'] as const).map(m => (
                            <button key={m} onClick={() => { setBlueSimMode(m); setBlueSimResult(null); }}
                              className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                                (blueSimMode === m ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>{m}</button>
                          ))}
                        </div>
                      </div>
                      {blueSimMode === '개수' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={blueSimCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setBlueSimCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                          </div>
                        </div>
                      )}
                      {blueSimMode === '목표' && (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={blueSimTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setBlueSimTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const lv = parseInt(blueSimLevel);
                      const expPct = parseFloat(blueSimExpPct);
                      let reason: string | null = null;
                      if (blueSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
                      else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
                      else if (blueSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
                      else if (blueSimMode === '개수') {
                        const count = parseInt(blueSimCount);
                        if (blueSimCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
                        else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
                      } else {
                        const targetLv = parseInt(blueSimTarget);
                        if (blueSimTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
                        else if (targetLv <= lv || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
                      }
                      return (
                        <button onClick={handleBlueSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      {blueSimMode === '목표' && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-zinc-400">필요 개수</span>
                          <div className="text-right">
                            {blueSimResult && blueSimResult.type === '목표'
                              ? <><span className="font-bold text-gray-800 dark:text-zinc-100">{blueSimResult.count.toLocaleString()}</span><span className="ml-1 text-sm text-gray-500 dark:text-zinc-400">개</span></>
                              : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
                        <div className="text-right">
                          {blueSimResult
                            ? <><Num n={blueSimResult.gainedExp} className="font-bold text-orange-600 dark:text-orange-400" /><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{blueSimResult.gainPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
                        <div className="text-right">
                          {blueSimResult
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{blueSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({blueSimResult.finalPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                    </div>
                  </>)}
                  {selected === 'monsterpark' && (<>
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 입장 횟수를 입력하면 도달 레벨을 계산합니다.</p>
                    {/* 정보 행 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={simLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">지역</span>
                        {(() => {
                          const lv = parseInt(simLevel);
                          if (lv >= 300) return <span className="text-xs text-red-400 dark:text-red-500">300레벨 미만 입력해주세요</span>;
                          if (lv >= 260) return <span className="px-2 py-0.5 rounded bg-orange-500 text-white text-xs font-bold">{getMonsterParkZone(lv)}</span>;
                          return <span className="text-xs text-red-400 dark:text-red-500">260레벨 이상 입력해주세요</span>;
                        })()}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="decimal" value={simExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                            placeholder="0.000" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">보약</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={simPotionBuff} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setSimPotionBuff(v); }}
                            className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setSimBeyond(v => !v)}
                          disabled={parseInt(simLevel) >= 279}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                            (parseInt(simLevel) >= 279
                              ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                              : 'cursor-pointer ' + (simBeyond
                                ? 'bg-orange-500 border-orange-500 text-white'
                                : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400'))}
                        >
                          버닝 BEYOND
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">썬데이</span>
                        <div className="flex gap-1">
                          {([
                            { val: '일반',   tip: '+0%' },
                            { val: '썬데이', tip: '+50%' },
                            { val: '스페셜', tip: '+300%' },
                          ] as const).map(({ val, tip }) => (
                            <TooltipWrapper key={val} tip={tip}>
                              <button
                                onClick={() => setSimSunday(val)}
                                className={
                                  'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                                  (simSunday === val
                                    ? 'bg-orange-500 border-orange-500 text-white'
                                    : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')
                                }
                              >
                                {val}
                              </button>
                            </TooltipWrapper>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">판수</span>
                      <div className="flex gap-1.5">
                        {[1,2,3,4,5,6,7].map(r => (
                          <button key={r} onClick={() => setSimRounds(r)}
                            className={'flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ' + (simRounds === r ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-orange-100 dark:hover:bg-orange-900/30')}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const lv = parseInt(simLevel);
                      const expPct = parseFloat(simExpPct);
                      const buff = parseFloat(simPotionBuff);
                      let reason: string | null = null;
                      if (simLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
                      else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
                      else if (simExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
                      else if (simPotionBuff !== '' && (isNaN(buff) || buff < 0 || buff > 100)) reason = '보약%가 올바르지 않아요';
                      return (
                        <button onClick={handleSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
                        <div className="text-right">
                          {simResult
                            ? <><Num n={simResult.gainedExp} className="font-bold text-orange-600 dark:text-orange-400" /><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{simResult.gainPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">달성</span>
                        <div className="text-right">
                          {simResult
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{simResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{simResult.finalPct.toFixed(3)}%</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                    </div>
                  </>)}
                </div>
              </div>
              {selected === 'mekaberry' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
                    <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">목표 레벨 역산</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">목표 레벨과 개수를 입력하면, 어느 시점부터 사용하면 되는지 알려줍니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={mekaRevTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaRevTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="290" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={mekaRevCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaRevCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const targetLv = parseInt(mekaRevTarget);
                      const count = parseInt(mekaRevCount);
                      let reason: string | null = null;
                      if (mekaRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
                      else if (targetLv < 281 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
                      else if (mekaRevCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
                      else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
                      return (
                        <button onClick={handleMekaRevCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
                        <div className="text-right">
                          {mekaRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{mekaRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({mekaRevResult.startPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">도달</span>
                        <div className="text-right">
                          {mekaRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{mekaRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      {mekaRevResult && !mekaRevResult.ok && (
                        <p className="text-xs text-red-500 text-center">{mekaRevResult.msg}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selected === 'expcoupon' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
                    <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">목표 레벨 역산</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">목표 레벨과 개수를 입력하면, 어느 시점부터 사용하면 되는지 알려줍니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={couponRevTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCouponRevTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="280" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={couponRevCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setCouponRevCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setCouponRevBeyond(v => !v)}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                            (couponRevBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                          버닝 BEYOND
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const targetLv = parseInt(couponRevTarget);
                      const count = parseInt(couponRevCount);
                      let reason: string | null = null;
                      if (couponRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
                      else if (targetLv < 261 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
                      else if (couponRevCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
                      else if (count < 1 || count > 99999) reason = '개수가 올바르지 않아요';
                      return (
                        <button onClick={handleCouponRevCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
                        <div className="text-right">
                          {couponRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{couponRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({couponRevResult.startPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">도달</span>
                        <div className="text-right">
                          {couponRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{couponRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      {couponRevResult && !couponRevResult.ok && (
                        <p className="text-xs text-red-500 text-center">{couponRevResult.msg}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selected === 'vipsauna' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
                    <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">목표 레벨 역산</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">목표 레벨과 잠수 시간을 입력하면, 어느 시점부터 사용하면 되는지 알려줍니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={vipRevTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipRevTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="280" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">잠수 시간</span>
                        <div className="flex items-center gap-1">
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={vipRevHours} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipRevHours(v); }} className="w-[60px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">시간</span>
                          </div>
                          <div className="relative flex items-center">
                            <input type="text" inputMode="numeric" value={vipRevMinutes} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipRevMinutes(v); }} className="w-[44px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                              placeholder="0" />
                            <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">분</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setVipRevBeyond(v => !v)}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                            (vipRevBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                          버닝 BEYOND
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const targetLv = parseInt(vipRevTarget);
                      const h = parseInt(vipRevHours);
                      const m = parseInt(vipRevMinutes);
                      let reason: string | null = null;
                      if (vipRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
                      else if (targetLv < 261 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
                      else if ((vipRevHours !== '' && (isNaN(h) || h < 0 || h > 999)) || (vipRevMinutes !== '' && (isNaN(m) || m < 0 || m > 59))) reason = '시간이 올바르지 않아요';
                      else if ((h || 0) === 0 && (m || 0) === 0) reason = '시간을 입력해주세요';
                      return (
                        <button onClick={handleVipRevCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
                        <div className="text-right">
                          {vipRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{vipRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({vipRevResult.startPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">도달</span>
                        <div className="text-right">
                          {vipRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{vipRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      {vipRevResult && !vipRevResult.ok && (
                        <p className="text-xs text-red-500 text-center">{vipRevResult.msg}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {selected === 'blueberry' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
                    <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">목표 레벨 역산</h3>
                  </div>
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-relaxed">목표 레벨과 개수를 입력하면, 어느 시점부터 사용하면 되는지 알려줍니다.</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={blueRevTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setBlueRevTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                            placeholder="280" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                        <div className="relative flex items-center">
                          <input type="text" inputMode="numeric" value={blueRevCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setBlueRevCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                            placeholder="0" />
                          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
                        <button
                          onClick={() => setBlueRevBeyond(v => !v)}
                          className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                            (blueRevBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                          버닝 BEYOND
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const targetLv = parseInt(blueRevTarget);
                      const count = parseInt(blueRevCount);
                      let reason: string | null = null;
                      if (blueRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
                      else if (targetLv < 261 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
                      else if (blueRevCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
                      else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
                      return (
                        <button onClick={handleBlueRevCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                          {reason ?? '계산하기'}
                        </button>
                      );
                    })()}
                    <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
                        <div className="text-right">
                          {blueRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{blueRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({blueRevResult.startPct.toFixed(3)}%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-zinc-400">도달</span>
                        <div className="text-right">
                          {blueRevResult?.ok
                            ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{blueRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                            : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                        </div>
                      </div>
                      {blueRevResult && !blueRevResult.ok && (
                        <p className="text-xs text-red-500 text-center">{blueRevResult.msg}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>}
          </>
        )}
      </div>
    </div>
  );
}
