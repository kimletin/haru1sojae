'use client';

import { useRef, useEffect } from 'react';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY } from '@/data/epicDungeon';
import { LEVEL_EXP } from '@/data/levelExp';

function fmt(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  return n.toLocaleString('ko-KR');
}

function pct(exp: number, level: number) {
  const req = LEVEL_EXP[level]?.required;
  if (!req) return '';
  return '+' + ((exp / req) * 100).toFixed(2) + '%';
}

interface TableProps {
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
}

function DungeonTable({ title, levels, data, metacoin, charLevel, headerColor, titleColor, badgeColor, rowBg, textColor }: TableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const row = activeRef.current;
      const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
      container.scrollTop = offset;
    }
  }, [charLevel]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className={'px-4 py-2.5 border-b ' + headerColor}>
        <h3 className={'text-sm font-semibold ' + titleColor}>{title}</h3>
      </div>
      <div ref={scrollRef} className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">레벨</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">0단계</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">1단계 ({metacoin.stage1.toLocaleString()}메포)</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">2단계 ({metacoin.stage2.toLocaleString()}메포)</th>
            </tr>
          </thead>
          <tbody>
            {levels.map(lv => {
              const d = data[lv];
              if (!d) return null;
              const isMe = lv === charLevel;
              const baseColor = isMe ? textColor : 'text-gray-700 dark:text-gray-300';
              const subColor = isMe ? textColor : 'text-gray-400 dark:text-gray-500';
              return (
                <tr
                  key={lv}
                  ref={isMe ? activeRef : undefined}
                  className={'border-b ' + (isMe ? rowBg + ' font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700')}
                >
                  <td className={'px-3 py-1.5 text-center ' + baseColor}>
                    {lv}
                    {isMe && <span className={'ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full ' + badgeColor}>나</span>}
                  </td>
                  <td className={'px-3 py-1.5 text-center ' + baseColor}>
                    {fmt(d.stage0)}
                    <span className={'text-xs ml-1 ' + subColor}>({pct(d.stage0, lv)})</span>
                  </td>
                  <td className={'px-3 py-1.5 text-center ' + baseColor}>
                    {fmt(d.stage1)}
                    <span className={'text-xs ml-1 ' + subColor}>({pct(d.stage1, lv)})</span>
                  </td>
                  <td className={'px-3 py-1.5 text-center ' + baseColor}>
                    {fmt(d.stage2)}
                    <span className={'text-xs ml-1 ' + subColor}>({pct(d.stage2, lv)})</span>
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

interface Props {
  charLevel: number;
}

export default function EpicDungeonTab({ charLevel }: Props) {
  const allLevels = Array.from({ length: 40 }, (_, i) => i + 260);

  return (
    <div className="space-y-6">
      <DungeonTable
        title="하이마운틴"
        levels={allLevels}
        data={HAIMOUNTAIN}
        metacoin={{ stage1: 7500, stage2: 22500 }}
        charLevel={charLevel}
        headerColor="bg-indigo-50 dark:bg-indigo-900/40 border-indigo-100 dark:border-indigo-800"
        titleColor="text-indigo-800 dark:text-indigo-300"
        badgeColor="bg-indigo-50 dark:bg-indigo-900/40"
        rowBg="bg-indigo-50 dark:bg-indigo-900/40"
        textColor="text-indigo-700"
      />
      <DungeonTable
        title="앵글러컴퍼니"
        levels={allLevels.filter(lv => lv >= 270)}
        data={ANGLER_COMPANY}
        metacoin={{ stage1: 10000, stage2: 30000 }}
        charLevel={charLevel}
        headerColor="bg-teal-50 dark:bg-teal-900/40 border-teal-100 dark:border-teal-800"
        titleColor="text-teal-800 dark:text-teal-300"
        badgeColor="bg-teal-50 dark:bg-teal-900/40"
        rowBg="bg-teal-50 dark:bg-teal-900/40"
        textColor="text-teal-700"
      />
      <DungeonTable
        title="악몽선경"
        levels={allLevels.filter(lv => lv >= 280)}
        data={NIGHTMARE_SANCTUARY}
        metacoin={{ stage1: 12500, stage2: 37500 }}
        charLevel={charLevel}
        headerColor="bg-rose-50 dark:bg-rose-900/40 border-rose-100 dark:border-rose-800"
        titleColor="text-rose-800 dark:text-rose-300"
        badgeColor="bg-rose-50 dark:bg-rose-900/40"
        rowBg="bg-rose-50 dark:bg-rose-900/40"
        textColor="text-rose-700"
      />
    </div>
  );
}
