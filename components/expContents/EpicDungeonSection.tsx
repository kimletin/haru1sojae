'use client';
import { useState, useEffect } from 'react';
import { DungeonTable } from '@/components/expContents/DungeonTable';
import SubTabs from '@/components/expContents/SubTabs';
import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY, AURUM_REGIS, type EpicDungeonData } from '@/data/epicDungeon';
import { EPIC_DUNGEON_ZONES, getEpicDungeonZone } from '@/data/epicDungeonZones';
import type { EpicDungeonZone } from '@/types';

// 존별 경험치 표 — 존을 추가하고 여기를 빠뜨리면 타입 체크가 잡는다(Record<EpicDungeonZone, …>)
const DATA: Record<EpicDungeonZone, Record<number, EpicDungeonData>> = {
  하이마운틴: HAIMOUNTAIN,
  앵글러컴퍼니: ANGLER_COMPANY,
  악몽선경: NIGHTMARE_SANCTUARY,
  '아우룸 레기스': AURUM_REGIS,
};

// 상단 탭·경험치표 제목 표기 (없으면 존 이름 그대로)
const LABELS: Partial<Record<EpicDungeonZone, string>> = { 앵글러컴퍼니: '앵글러 컴퍼니' };

// 존 목록·입장 레벨은 data/epicDungeonZones.ts 한 곳에서 가져온다.
// name = 존 키(데이터·아이콘·저장값과 공유) / label = 화면 표기(상단 탭·경험치표 제목)
const DUNGEONS = EPIC_DUNGEON_ZONES.map(z => ({
  name: z.zone,
  label: LABELS[z.zone] ?? z.zone,
  minLv: z.minLevel,
  data: DATA[z.zone],
}));

interface Props {
  charLevel: number;
  epicDungeonBonus: number;
  hasCharacter: boolean;
}

export default function EpicDungeonSection({ charLevel, epicDungeonBonus, hasCharacter }: Props) {
  // 처음엔 입장 가능한 가장 높은 존
  const [selectedDungeon, setSelectedDungeon] = useState(getEpicDungeonZone(charLevel));
  useEffect(() => {
    setSelectedDungeon(getEpicDungeonZone(charLevel));
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
