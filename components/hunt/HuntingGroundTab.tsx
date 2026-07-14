'use client';

import CardHeader from '@/components/ui/CardHeader';

import { useState, useRef, useEffect } from 'react';
import { HUNTING_REGIONS, type HuntingGround } from '@/data/huntingGrounds';
import { MONSTER_EXP } from '@/data/monsterExp';
import { getMonstersAtMap } from '@/data/regionMonsters';
import HuntingGroundDetailModal from '@/components/hunt/HuntingGroundDetailModal';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { rankColor, RankBadge, computeTieRanks } from '@/components/ui/ranking';
import { getExpPenalty } from '@/data/expPenalty';

function computeGroundScore(g: HuntingGround, charLevel: number): number {
  return g.mobs.reduce((sum, mob) => {
    const exp = MONSTER_EXP[mob.level] ?? 0;
    return sum + exp * mob.count * getExpPenalty(charLevel - mob.level);
  }, 0);
}

interface Props {
  charLevel: number;
  huntingRegion: string;
  huntingGround: string;
  hasCharacter?: boolean;
  onAddCharacter?: () => void;
}

const REGION_LEVEL_RANGE: Record<string, string> = {
  '세르니움':   'Lv.260-264',
  '아르크스':   'Lv.265-269',
  '오디움':     'Lv.270-274',
  '도원경':     'Lv.275-279',
  '아르테리아': 'Lv.280-284',
  '카르시온':   'Lv.285-289',
  '탈라하트':   'Lv.290-294',
  '기어드락':   'Lv.295-299',
};

export default function HuntingGroundTab({ charLevel, huntingRegion, huntingGround, hasCharacter = true, onAddCharacter }: Props) {
  const [selectedRegion, setSelectedRegion] = useState(huntingRegion || '세르니움');
  const [detailGround, setDetailGround] = useState<HuntingGround | null>(null);

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
  const regionIndex = HUNTING_REGIONS.findIndex(r => r.name === selectedRegion);
  const regionFolder = `${regionIndex + 1}.${selectedRegion}`;
  const imgSrcFor = (g: HuntingGround) =>
    `/maps/${encodeURIComponent(regionFolder)}/${encodeURIComponent(g.name)}.webp`;

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
      {/* 지역 선택 (모바일: 4열 그리드 / 데스크톱: 세로 90px 정사각형 고정) */}
      <div className="grid grid-cols-4 lg:grid-cols-1 gap-1.5 shrink-0 w-full lg:w-[90px] self-start">
        {HUNTING_REGIONS.map(r => (
          <button
            key={r.name}
            onClick={() => setSelectedRegion(r.name)}
            className={
              'h-20 lg:h-auto lg:aspect-square rounded-lg shadow-sm text-xs font-medium transition-colors cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ' +
              (selectedRegion === r.name
                ? 'bg-orange-500 text-white border border-orange-500'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
            }
          >
            <img src={`/icons/${encodeURIComponent(r.name)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
            <div className="font-semibold">{r.name}</div>
            <div className={'text-[10px] mt-0.5 ' + (selectedRegion === r.name ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
              {REGION_LEVEL_RANGE[r.name]}
            </div>
          </button>
        ))}
      </div>

      {/* 테이블 카드 */}
      <div className="flex-1 min-w-0 lg:max-h-[762px] bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
        <CardHeader title={region.name} className="shrink-0" />
        <div ref={scrollRef} className="overflow-y-auto flex-1 min-h-0">
          <table className="table-fixed text-[12px] lg:text-sm border-collapse w-full">
            <colgroup>
              <col style={{ width: '42%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '17%' }} />
              <col style={{ width: '19%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">사냥터</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">몬스터 레벨</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">마리수</th>
                <th className="text-center px-4 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">세부 정보</th>
              </tr>
            </thead>
            <tbody>
              {region.grounds.map((g, i) => {
                const isMe = hasCharacter && selectedRegion === huntingRegion && g.name === huntingGround;
                const rowBg = isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700';
                const textColor = isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300';
                const detailBtn = (
                  <button
                    onClick={() => setDetailGround(g)}
                    aria-label="세부 정보"
                    className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-md border border-gray-200 dark:border-zinc-600 text-gray-400 dark:text-zinc-500 hover:text-orange-500 hover:border-orange-400 transition-colors cursor-pointer shrink-0"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5"><circle cx="9" cy="9" r="6" /><path d="M14 14l4 4" strokeLinecap="round" /></svg>
                  </button>
                );

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
                      <td className={'px-4 py-1.5 text-center ' + textColor}>{totalCount}</td>
                      <td className="px-4 py-1.5 text-center">{detailBtn}</td>
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
                    {j === 0 ? <td className="px-4 py-1.5 text-center" rowSpan={g.mobs.length}>{detailBtn}</td> : null}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 우측 순위 카드 */}
      {(() => {
        const all = HUNTING_REGIONS.flatMap(r => {
          // 지역 입장 레벨 = 해당 지역 최소 몹 레벨. 입장 가능한 지역의 사냥터만 포함.
          const regionEntryLevel = Math.min(...r.grounds.flatMap(g => g.mobs.map(m => m.level)));
          return charLevel >= regionEntryLevel ? r.grounds : [];
        });
        const scored = all
          .map(g => ({ name: g.name, score: computeGroundScore(g, charLevel) }))
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ko'));
        const top15 = scored.slice(0, 20);
        const maxScore = top15[0]?.score ?? 1;
        const pctOf = (s: number) => (maxScore > 0 ? (s / maxScore * 100).toFixed(1) : '0.0');
        // 계산값(score)이 같으면 공동 순위 — 표시 반올림이 아닌 원본 값 기준
        const ranks = computeTieRanks(top15, (it) => it.score);
        return (
          <div className="w-full lg:w-[300px] lg:shrink-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
            <CardHeader title="사냥터 효율 순위" className="shrink-0 flex items-center justify-center gap-1.5">
              <TooltipWrapper
                className="inline-flex"
                tipClassName="w-56 text-center"
                tip="캐릭터 레벨 기준 (순경험치) × (마리수) × (경험치 패널티)를 계산하여 매긴 순위입니다."
              >
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-500 dark:border-zinc-400 text-gray-600 dark:text-zinc-300 text-[10px] font-bold leading-none cursor-help">?</span>
              </TooltipWrapper>
            </CardHeader>
            <div className="flex flex-col">
              {!hasCharacter ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 py-10">
                  <p className="text-sm text-gray-400 dark:text-zinc-500">캐릭터를 추가해주세요</p>
                  {onAddCharacter && (
                    <button onClick={onAddCharacter} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors cursor-pointer">캐릭터 추가</button>
                  )}
                </div>
              ) : top15.map((item, idx) => {
                const isMe = hasCharacter && item.name === huntingGround;
                const pct = pctOf(item.score);
                const rank = ranks[idx];
                return (
                  <div
                    key={item.name}
                    className={'flex items-center gap-2 px-4 py-1.5 border-b border-gray-100 dark:border-zinc-700 transition-colors ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
                  >
                    <RankBadge rank={rank} />
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={'text-[12px] lg:text-sm truncate ' + (isMe ? 'font-bold text-orange-600' : 'text-gray-700 dark:text-zinc-300')}>
                        {item.name}
                      </span>
                      {isMe && <span className="text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full shrink-0">나</span>}
                    </div>
                    <span className="text-[12px] lg:text-sm font-semibold shrink-0" style={{ color: rankColor(rank, top15.length) }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
    {detailGround && (
      <HuntingGroundDetailModal
        region={selectedRegion}
        groundName={detailGround.name}
        imageSrc={imgSrcFor(detailGround)}
        mobDir={regionFolder}
        mobCount={detailGround.mobs.reduce((s, m) => s + m.count, 0)}
        monsters={getMonstersAtMap(detailGround.name, detailGround.mobs.map(m => m.level))}
        onClose={() => setDetailGround(null)}
      />
    )}
    </>
  );
}
