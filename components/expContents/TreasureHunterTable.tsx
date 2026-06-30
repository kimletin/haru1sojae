'use client';
import { useState, useRef, useEffect } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { pctNoSign } from '@/components/expContents/shared';
import { MONSTER_EXP } from '@/data/monsterExp';
import { TREASURE_MULTIPLIERS, type TreasureBox } from '@/data/treasureHunter';

// ─── TreasureHunterTable ──────────────────────────────────────────────────────

const TREASURE_LEVELS = Array.from({ length: 40 }, (_, i) => i + 260);
export const TREASURE_BOXES: TreasureBox[] = ['폴로/프리토', '에스페시아'];
export const TREASURE_BOX_META: Record<TreasureBox, { label: string; sub: string; icon: string }> = {
  '폴로/프리토': { label: '골드 트레져 박스', sub: '폴로/프리토', icon: '골드 트레져 박스' },
  '에스페시아':  { label: '다이아 트레져 박스', sub: '에스페시아', icon: '다이아 트레져 박스' },
};

export function TreasureHunterTable({ monsterLevel, charLevel, treasureBonus = 0, selectedBox, hasCharacter = true }: {
  monsterLevel: number; charLevel: number; treasureBonus?: number; selectedBox: TreasureBox; hasCharacter?: boolean;
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
      <CardHeader title={TREASURE_BOX_META[selectedBox].label} className="shrink-0" />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
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
              const isMe = hasCharacter && lv === monsterLevel;
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
                    {pctNoSign(rare, charLevel)}
                    <span className={'text-xs ml-1 ' + subColor}>(+<Num n={rare} />)</span>
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    {pctNoSign(epic, charLevel)}
                    <span className={'text-xs ml-1 ' + subColor}>(+<Num n={epic} />)</span>
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    {pctNoSign(unique, charLevel)}
                    <span className={'text-xs ml-1 ' + subColor}>(+<Num n={unique} />)</span>
                  </td>
                  <td className={'px-2 py-1.5 text-center ' + baseColor}>
                    {pctNoSign(legendary, charLevel)}
                    <span className={'text-xs ml-1 ' + subColor}>(+<Num n={legendary} />)</span>
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
