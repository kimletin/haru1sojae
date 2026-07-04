'use client';
import { useState, useRef, useEffect } from 'react';
import Num from '@/components/ui/Num';
import SimNumInput from '@/components/expContents/SimNumInput';
import { pctNoSign } from '@/components/expContents/shared';

// ─── DungeonTable ─────────────────────────────────────────────────────────────

interface DungeonTableProps {
  title: string;
  levels: number[];
  data: Record<number, { stage0: number; stage1: number; stage2: number }>;
  charLevel: number;
  headerColor: string;
  titleColor: string;
  badgeColor: string;
  rowBg: string;
  textColor: string;
  epicDungeonBonus: number;
  scrollKey?: string;
  hasCharacter?: boolean;
}

export function DungeonTable({ title, levels, data, charLevel, headerColor, titleColor, badgeColor, rowBg, textColor, epicDungeonBonus, scrollKey, hasCharacter = true }: DungeonTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [epicBonusInput, setEpicBonusInput] = useState(epicDungeonBonus > 0 ? String(epicDungeonBonus) : '');

  useEffect(() => {
    setEpicBonusInput(epicDungeonBonus > 0 ? String(epicDungeonBonus) : '');
  }, [epicDungeonBonus]);

  const bonusPct = parseFloat(epicBonusInput) || 0;

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

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col lg:h-full">
      <div className={'px-4 py-2.5 border-b shrink-0 ' + headerColor}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor}>{title}</h3>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <div ref={tableRef}>
          <table className="table-fixed text-[12px] lg:text-sm border-collapse w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">레벨</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">0단계</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">1단계</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">2단계</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(lv => {
                const d = data[lv];
                if (!d) return null;
                const isMe = hasCharacter && lv === charLevel;
                const baseColor = isMe ? textColor : 'text-gray-700 dark:text-zinc-300';
                const subColor  = isMe ? textColor : 'text-gray-400 dark:text-zinc-500';

                const bonusAmt = Math.round(d.stage0 * bonusPct / 100);
                const s0 = d.stage0 + bonusAmt;
                const s1 = d.stage1 + bonusAmt;
                const s2 = d.stage2 + bonusAmt;

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
                    <td className={'px-4 py-1.5 text-center ' + baseColor}>
                      <Num n={s0} />
                      <span className={'text-xs ml-1 ' + subColor}>(+{pctNoSign(s0, lv)})</span>
                    </td>
                    <td className={'px-4 py-1.5 text-center ' + baseColor}>
                      <Num n={s1} />
                      <span className={'text-xs ml-1 ' + subColor}>(+{pctNoSign(s1, lv)})</span>
                    </td>
                    <td className={'px-4 py-1.5 text-center ' + baseColor}>
                      <Num n={s2} />
                      <span className={'text-xs ml-1 ' + subColor}>(+{pctNoSign(s2, lv)})</span>
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
          <SimNumInput value={epicBonusInput} onChange={setEpicBonusInput} unit="%" pad="4" width="w-14" height="h-[22px]" max={200} />
        </div>
      </div>

    </div>
  );
}
