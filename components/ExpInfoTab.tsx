'use client';

import { useRef, useState, useEffect } from 'react';
import { LEVEL_EXP } from '@/data/levelExp';
import { getExpMultiplier } from '@/lib/calculator';
import type { MobGroup } from '@/types';

interface PenaltyRow {
  label: string;
  diff: number | null;
  mult: number;
}

const PENALTY_ROWS: PenaltyRow[] = [
  { label: '40 이상', diff: null, mult: 0.70 },
  ...Array.from({ length: 79 }, (_, i) => {
    const d = 39 - i;
    return { label: String(d), diff: d, mult: getExpMultiplier(d, 0) };
  }),
  { label: '-40 이하', diff: null, mult: 0 },
];

function fmtBig(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  return n.toLocaleString('ko-KR');
}

interface Props {
  charLevel: number;
  monsterLevel: number;
  huntingMobs?: MobGroup[];
}

export default function ExpInfoTab({ charLevel, monsterLevel, huntingMobs }: Props) {
  const mobs = huntingMobs && huntingMobs.length > 1 ? huntingMobs : null;
  const mobLevels = mobs
    ? mobs.map(m => m.level).filter((v, i, a) => a.indexOf(v) === i)
    : [monsterLevel];

  const levels = Object.keys(LEVEL_EXP).map(Number).sort((a, b) => a - b);

  const activeDiffs = new Set(mobLevels.map(lv => charLevel - lv));

  const leftScrollRef  = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const activeExpRef     = useRef<HTMLTableRowElement>(null);
  const activePenaltyRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (activeExpRef.current && leftScrollRef.current) {
      const c = leftScrollRef.current;
      const r = activeExpRef.current;
      c.scrollTop = r.offsetTop - c.clientHeight / 2 + r.clientHeight / 2;
    }
  }, [charLevel]);

  useEffect(() => {
    if (activePenaltyRef.current && rightScrollRef.current) {
      const c = rightScrollRef.current;
      const r = activePenaltyRef.current;
      c.scrollTop = r.offsetTop - c.clientHeight / 2 + r.clientHeight / 2;
    }
  }, [charLevel, monsterLevel]);

  const TABLE_H = 'max-h-[500px]';

  return (
    <div className="w-fit mx-auto">
      <div className="flex flex-row gap-6 items-start">
        {/* 레벨별 필요 경험치 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">레벨별 필요 경험치</h3>
          </div>
          <div ref={leftScrollRef} className={`overflow-y-auto ${TABLE_H}`}>
            <table className="table-fixed text-sm border-collapse">
              <colgroup>
                <col style={{width:'100px'}} />
                <col style={{width:'120px'}} />
                <col style={{width:'90px'}} />
                <col style={{width:'100px'}} />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                  <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-medium">레벨</th>
                  <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-medium">필요 경험치</th>
                  <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-medium">증가율</th>
                  <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-medium">누적 비율</th>
                </tr>
              </thead>
              <tbody>
                {levels.map(lv => {
                  const d = LEVEL_EXP[lv];
                  const isMe = lv === charLevel;
                  return (
                    <tr key={lv} ref={isMe ? activeExpRef : undefined} className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-800')}>
                      <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300')}>
                        {lv}
                        {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                      </td>
                      <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300')}>{fmtBig(d.required)}</td>
                      <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-600 dark:text-zinc-400')}>{'+'+(d.increase*100).toFixed(0)+'%'}</td>
                      <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-600 dark:text-zinc-400')}>{(d.ratio*100).toFixed(3)+'%'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 경험치 패널티 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">경험치 패널티</h3>
          </div>
          <div ref={rightScrollRef} className={`overflow-y-auto ${TABLE_H}`}>
            <table className="table-fixed text-sm border-collapse">
              <colgroup>
                <col style={{width:'160px'}} />
                <col style={{width:'110px'}} />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                  <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-medium">캐릭터 - 몬스터</th>
                  <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-medium">경험치 배율</th>
                </tr>
              </thead>
              <tbody>
                {PENALTY_ROWS.map((row, i) => {
                  const isActive = row.diff !== null
                    ? activeDiffs.has(row.diff)
                    : row.label === '40 이상'
                      ? mobLevels.some(lv => charLevel - lv >= 40)
                      : mobLevels.some(lv => charLevel - lv <= -40);
                  const isFirstActive = isActive && !PENALTY_ROWS.slice(0, i).some((r, j) => {
                    const prev = r.diff !== null
                      ? activeDiffs.has(r.diff)
                      : r.label === '40 이상'
                        ? mobLevels.some(lv => charLevel - lv >= 40)
                        : mobLevels.some(lv => charLevel - lv <= -40);
                    return prev;
                  });
                  return (
                    <tr
                      key={i}
                      ref={isFirstActive ? activePenaltyRef : undefined}
                      className={'border-b ' + (isActive ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-800')}
                    >
                      <td className={'px-5 py-1.5 text-center ' + (isActive ? 'text-orange-400' : 'text-gray-700 dark:text-zinc-300')}>
                        {row.label}
                        {isActive && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                      </td>
                      <td className={'px-5 py-1.5 text-center font-semibold ' + (isActive ? 'text-orange-400' : 'text-gray-700 dark:text-zinc-300')}>
                        {row.label === '-40 이하' ? '0%' : (row.mult * 100).toFixed(0) + '%'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
