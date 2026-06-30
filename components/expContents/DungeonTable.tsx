'use client';
import { useState, useRef, useEffect } from 'react';
import Num from '@/components/ui/Num';
import { pctNoSign, type BonusEntry } from '@/components/expContents/shared';

// ─── DungeonTable ─────────────────────────────────────────────────────────────

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
  hasCharacter?: boolean;
}

type StageKey = 'stage0' | 'stage1' | 'stage2';

export function DungeonTable({ title, levels, data, metacoin, charLevel, headerColor, titleColor, badgeColor, rowBg, textColor, epicDungeonBonus, epicDungeonBonuses, scrollKey, hasCharacter = true }: DungeonTableProps) {
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


      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
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
                const isMe = hasCharacter && lv === charLevel;
                const baseColor = isMe ? textColor : 'text-gray-700 dark:text-zinc-300';
                const subColor  = isMe ? textColor : 'text-gray-400 dark:text-zinc-500';

                const bonusAmt = Math.round(d.stage0 * bonusPct / 100);
                const s0 = d.stage0 + bonusAmt;
                const s1 = d.stage1 + bonusAmt;
                const s2 = d.stage2 + bonusAmt;

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
                    <td className={'px-4 py-1.5 text-center ' + baseColor}>
                      {pctNoSign(s0, lv)}
                      <span className={'text-xs ml-1 ' + subColor + (hasBonus ? ' cursor-pointer' : '')} {...makeHandlers('stage0')}>(+<Num n={s0} />)</span>
                    </td>
                    <td className={'px-4 py-1.5 text-center ' + baseColor}>
                      {pctNoSign(s1, lv)}
                      <span className={'text-xs ml-1 ' + subColor + (hasBonus ? ' cursor-pointer' : '')} {...makeHandlers('stage1')}>(+<Num n={s1} />)</span>
                    </td>
                    <td className={'px-4 py-1.5 text-center ' + baseColor}>
                      {pctNoSign(s2, lv)}
                      <span className={'text-xs ml-1 ' + subColor + (hasBonus ? ' cursor-pointer' : '')} {...makeHandlers('stage2')}>(+<Num n={s2} />)</span>
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
