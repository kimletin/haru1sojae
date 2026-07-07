'use client';
import { useState, useEffect } from 'react';
import { DungeonTable } from '@/components/expContents/DungeonTable';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY } from '@/data/epicDungeon';

const DUNGEONS = [
  { name: '하이마운틴',   minLv: 260, data: HAIMOUNTAIN },
  { name: '앵글러컴퍼니', minLv: 270, data: ANGLER_COMPANY },
  { name: '악몽선경',     minLv: 280, data: NIGHTMARE_SANCTUARY },
];

interface Props {
  charLevel: number;
  epicDungeonBonus: number;
  hasCharacter: boolean;
}

export default function EpicDungeonSection({ charLevel, epicDungeonBonus, hasCharacter }: Props) {
  const defaultDungeon = [...DUNGEONS].reverse().find(d => charLevel >= d.minLv)?.name ?? DUNGEONS[0].name;
  const [selectedDungeon, setSelectedDungeon] = useState(defaultDungeon);
  useEffect(() => {
    setSelectedDungeon([...DUNGEONS].reverse().find(d => charLevel >= d.minLv)?.name ?? DUNGEONS[0].name);
  }, [charLevel]);
  const dungeon = DUNGEONS.find(d => d.name === selectedDungeon) ?? DUNGEONS[0];
  const epicLevels = Array.from({ length: 40 }, (_, i) => i + 260).filter(lv => lv >= dungeon.minLv);

  return (
          /* 에픽 던전 — 전체 너비 사용 */
          <div className="flex-1 flex flex-col gap-1.5 lg:h-[664px]">
            <div className="flex gap-1.5 shrink-0">
              {DUNGEONS.map(d => (
                <button
                  key={d.name}
                  onClick={() => setSelectedDungeon(d.name)}
                  className={
                    'flex-1 rounded-lg text-sm font-medium transition-colors cursor-pointer py-2 px-2 lg:px-3 flex items-center justify-center gap-1.5 lg:gap-2 ' +
                    (selectedDungeon === d.name
                      ? 'bg-orange-500 text-white border border-orange-500'
                      : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
                  }
                >
                  <img src={`/icons/${encodeURIComponent(d.name)}.png`} alt="" className="w-10 h-10 lg:w-12 lg:h-12 shrink-0 object-contain" />
                  <div className="flex flex-col items-center">
                    <div className="text-[12px] lg:text-sm font-semibold whitespace-nowrap">{d.name}</div>
                    <div className={'text-xs mt-0.5 ' + (selectedDungeon === d.name ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
                      Lv.{d.minLv}~
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex-1 min-h-0">
              <DungeonTable
                title={dungeon.name}
                levels={epicLevels}
                data={dungeon.data}
                charLevel={charLevel}
                headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
                titleColor="text-gray-800 dark:text-zinc-100"
                badgeColor="bg-orange-500 dark:bg-orange-700"
                rowBg="bg-orange-50 dark:bg-orange-900/40"
                textColor="text-orange-600"
                epicDungeonBonus={epicDungeonBonus}
                scrollKey={'epicdungeon' + selectedDungeon}
                hasCharacter={hasCharacter}
              />
            </div>
          </div>
  );
}
