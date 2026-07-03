'use client';

import CardHeader from '@/components/ui/CardHeader';

import { useRef, useEffect } from 'react';
import { LEVEL_EXP } from '@/data/levelExp';
import type { MobGroup } from '@/types';
import Num from '@/components/ui/Num';
import { PENALTY_SEGMENTS, type PenaltySegment } from '@/data/expPenalty';

interface Props {
  charLevel: number;
  monsterLevel: number;
  huntingMobs?: MobGroup[];
  hasCharacter?: boolean;
}

export default function ExpInfoTab({ charLevel, monsterLevel, huntingMobs, hasCharacter = true }: Props) {
  const mobs = huntingMobs && huntingMobs.length > 1 ? huntingMobs : null;
  const mobLevels = mobs
    ? mobs.map(m => m.level).filter((v, i, a) => a.indexOf(v) === i)
    : [monsterLevel];

  const levels = Object.keys(LEVEL_EXP).map(Number).sort((a, b) => a - b).filter(lv => lv < 300);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (activeRef.current && scrollRef.current) {
        const c = scrollRef.current, r = activeRef.current;
        c.scrollTop = r.offsetTop - c.clientHeight / 2 + r.clientHeight / 2;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [charLevel]);

  const isRowActive = (row: PenaltySegment) => hasCharacter && mobLevels.some(lv => row.test(charLevel - lv));

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
        {/* 레벨별 필요 경험치 */}
        <div className="flex-[55] min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
          <CardHeader title="레벨별 필요 경험치" className="shrink-0" />
          <div className="relative lg:flex-1 lg:min-h-0">
          <div ref={scrollRef} className="max-h-[400px] lg:max-h-none lg:absolute lg:inset-0 overflow-y-auto">
          <table className="table-fixed text-sm border-collapse w-full">
            <colgroup>
              <col style={{width:'25%'}} />
              <col style={{width:'27%'}} />
              <col style={{width:'24%'}} />
              <col style={{width:'24%'}} />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">레벨</th>
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">필요 경험치</th>
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">증가율</th>
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">누적 비율</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(lv => {
                const d = LEVEL_EXP[lv];
                const isMe = hasCharacter && lv === charLevel;
                return (
                  <tr key={lv} ref={isMe ? activeRef : undefined} className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-800')}>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300')}>
                      {lv}
                      {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                    </td>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300')}><Num n={d.required} /></td>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-600 dark:text-zinc-400')}>{'+'+(d.increase*100).toFixed(0)+'%'}</td>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-600 dark:text-zinc-400')}>{(d.ratio*100).toFixed(3)+'%'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          </div>
        </div>

        {/* 경험치 패널티 */}
        <div className="flex-[45] min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <CardHeader title="경험치 패널티" />
          <table className="table-fixed text-sm border-collapse w-full">
            <colgroup>
              <col style={{width:'30%'}} />
              <col style={{width:'34%'}} />
              <col style={{width:'36%'}} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold">캐릭터 - 몬스터</th>
                <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold">경험치 배율</th>
                <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold">비고</th>
              </tr>
            </thead>
            <tbody>
              {PENALTY_SEGMENTS.map((row, i) => {
                const isActive = isRowActive(row);
                return (
                  <tr
                    key={i}
                    className={'border-b ' + (isActive ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-800')}
                  >
                    <td className={'px-2 py-1.5 text-center whitespace-nowrap ' + (isActive ? 'text-orange-400' : 'text-gray-700 dark:text-zinc-300')}>
                      {row.label}
                      {isActive && <span className="ml-1 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                    </td>
                    <td className={'px-2 py-1.5 text-center whitespace-nowrap font-semibold ' + (isActive ? 'text-orange-400' : 'text-gray-700 dark:text-zinc-300')}>
                      {row.value}
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs text-gray-400 dark:text-zinc-500 leading-tight">
                      {row.note ?? ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
