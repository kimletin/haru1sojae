'use client';
import { useState, useEffect } from 'react';
import { DungeonTable } from '@/components/expContents/DungeonTable';
import SubTabs from '@/components/expContents/SubTabs';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY, AURUM_REGIS } from '@/data/epicDungeon';

// name = 존 키(데이터·아이콘·저장값과 공유) / label = 화면 표기(상단 탭·경험치표 제목)
const DUNGEONS = [
  { name: '하이마운틴',   label: '하이마운틴',    minLv: 260, data: HAIMOUNTAIN },
  { name: '앵글러컴퍼니', label: '앵글러 컴퍼니', minLv: 270, data: ANGLER_COMPANY },
  { name: '악몽선경',     label: '악몽선경',      minLv: 280, data: NIGHTMARE_SANCTUARY },
  { name: '아우룸 레기스', label: '아우룸 레기스', minLv: 290, data: AURUM_REGIS },
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
          <div className="flex-1 flex flex-col gap-1.5">
            <SubTabs
              items={DUNGEONS.map(d => ({ key: d.name, label: d.label, icon: d.name }))}
              current={selectedDungeon}
              onSelect={setSelectedDungeon}
            />
            <div className="flex-1 min-h-0">
              <DungeonTable
                title={dungeon.label}
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
