'use client';

import { useState, useRef, useEffect } from 'react';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';
import { MONSTER_EXP } from '@/data/monsterExp';
import Num from '@/components/Num';

interface Props {
  charLevel: number;
  huntingRegion: string;
  huntingGround: string;
}

const REGION_LEVEL_RANGE: Record<string, string> = {
  '세르니움':   'Lv.260~264',
  '아르크스':   'Lv.265~269',
  '오디움':     'Lv.270~274',
  '도원경':     'Lv.275~279',
  '아르테리아': 'Lv.280~284',
  '카르시온':   'Lv.285~289',
  '탈라하트':   'Lv.290~294',
  '기어드락':   'Lv.295~299',
};

export default function HuntingGroundTab({ charLevel, huntingRegion, huntingGround }: Props) {
  const [selectedRegion, setSelectedRegion] = useState(huntingRegion || '세르니움');

  useEffect(() => {
    setSelectedRegion(huntingRegion);
  }, [huntingRegion]);

  const activeRef = useRef<HTMLTableRowElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [selectedRegion]);

  const region = HUNTING_REGIONS.find(r => r.name === selectedRegion)!;

  return (
    <div className="flex gap-4 items-start">
      {/* 지역 선택 (3열 그리드) */}
      <div className="grid grid-cols-3 gap-1.5 shrink-0 w-[282px] self-start">
        {HUNTING_REGIONS.map(r => (
          <button
            key={r.name}
            onClick={() => setSelectedRegion(r.name)}
            className={
              'aspect-square rounded-lg text-sm font-medium transition-colors cursor-pointer text-center flex flex-col items-center justify-center ' +
              (selectedRegion === r.name
                ? 'bg-orange-500 text-white border border-orange-500'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
            }
          >
            <div className="font-semibold">{r.name}</div>
            <div className={'text-xs mt-0.5 ' + (selectedRegion === r.name ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
              {REGION_LEVEL_RANGE[r.name]}
            </div>
          </button>
        ))}
      </div>

      {/* 테이블 카드 */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
          <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">
            {region.name}
          </h3>
        </div>
        <div ref={scrollRef} className="overflow-y-auto" style={{maxHeight:'644px'}}>
          <table className="table-fixed text-sm border-collapse w-full">
            <colgroup>
              <col style={{ width: '34%' }} />
              <col style={{ width: '23%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '29%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">사냥터</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">몬스터 레벨</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">마리수</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">순 경험치</th>
              </tr>
            </thead>
            <tbody>
              {region.grounds.map((g, i) => {
                const isMe = selectedRegion === huntingRegion && g.name === huntingGround;
                const rowBg = isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700';
                const textColor = isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300';

                if (g.mobs.length > 1) {
                  const levelStr = g.mobs.map(m => m.level).join('/');
                  const totalCount = g.mobs.reduce((sum, mob) => sum + mob.count, 0);
                  return (
                    <tr key={i} ref={isMe ? activeRef : undefined} className={'border-b ' + rowBg}>
                      <td className={'px-4 py-1.5 text-center ' + textColor}>
                        {g.name}
                        {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                      </td>
                      <td className={'px-4 py-1.5 text-center ' + textColor}>{levelStr}</td>
                      <td className={'px-4 py-1.5 ' + textColor} style={{textAlign:'center'}}>{totalCount}</td>
                      <td className={'px-4 py-1.5 text-center ' + textColor}>
                        {g.mobs.map((m, mi) => (
                          <span key={mi}>{mi > 0 && '/'}<Num n={MONSTER_EXP[m.level] ?? 0} /></span>
                        ))}
                      </td>
                    </tr>
                  );
                }
                return g.mobs.map((mob, j) => (
                  <tr
                    key={`${i}-${j}`}
                    ref={isMe && j === 0 ? activeRef : undefined}
                    className={'border-b ' + rowBg}
                  >
                    {j === 0 ? (
                      <td className={'px-4 py-1.5 text-center ' + textColor} rowSpan={g.mobs.length}>
                        {g.name}
                        {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                      </td>
                    ) : null}
                    <td className={'px-4 py-1.5 text-center ' + textColor}>{mob.level}</td>
                    <td className={'px-4 py-1.5 text-center ' + textColor}>{mob.count}</td>
                    <td className={'px-4 py-1.5 text-center ' + textColor}><Num n={MONSTER_EXP[mob.level] ?? 0} /></td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
