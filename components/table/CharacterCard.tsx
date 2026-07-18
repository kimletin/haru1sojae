'use client';

import CardHeader from '@/components/ui/CardHeader';
import { assetSlug } from '@/lib/assetSlug';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import type { CharMeta } from '@/types';
import {
  type HistoryPoint,
  type Ranking,
  kstDate,
  computeSlots,
  computeDelta,
  formatDate,
  formatDateKR,
  formatExpKR,
} from '@/components/table/charHistoryUtils';

export type { HistoryPoint, Ranking, RankPoint } from '@/components/table/charHistoryUtils';

interface Props {
  name: string;
  level: number;
  meta: CharMeta | null;
  isEmpty?: boolean;
  history: HistoryPoint[];
  ranking: Ranking | null;
  loading: boolean;
  onOpenDetail?: () => void;
}

// 헤더 우측 "상세" 버튼 아이콘 (돋보기, 헤더 아이콘 톤에 맞춤)
function DetailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
}

export default function CharacterCard({ name, level, meta, isEmpty, history, ranking, loading, onOpenDetail }: Props) {
  const hasApi = !!meta?.ocid;
  const todayData = history.find(p => p.date === kstDate(0)) ?? null;
  const slots = computeSlots(history);

  if (isEmpty) {
    return (
      <div className="character-card bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <CardHeader title="캐릭터 정보" />
        <div className="flex flex-col lg:flex-row lg:items-stretch lg:h-[185px]">
          <div className="flex flex-col px-4 flex-1 min-w-0 pt-1 pb-5 items-center justify-center gap-3">
            <div className="w-28 h-28 rounded-xl shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">?</div>
            <p className="text-sm text-gray-400 dark:text-zinc-500">캐릭터를 추가해주세요</p>
          </div>
          <div className="h-px lg:h-auto w-auto lg:w-px bg-gray-100 dark:bg-zinc-700 mx-4 lg:mx-0 lg:my-4" />
          <div className="w-full lg:w-[44%] lg:shrink-0 px-5 py-2 min-w-0 flex flex-col">
            <p className="text-xs text-gray-700 dark:text-zinc-500 mb-2 mt-3">경험치 히스토리 (7일)</p>
            <div className="flex-1 flex items-center justify-center text-xs text-gray-300 dark:text-zinc-600 text-center leading-relaxed">
              캐릭터를 추가해주세요
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="character-card bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
      <CardHeader title="캐릭터 정보" className="relative">
        {hasApi && onOpenDetail && (
          <button
            onClick={onOpenDetail}
            aria-label="캐릭터 상세 정보"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <DetailIcon />
          </button>
        )}
      </CardHeader>

      <div className="relative flex flex-col lg:flex-row lg:items-stretch lg:h-[172px]">
        {/* 좌측: 캐릭터 정보 */}
        <div className="flex flex-col px-4 py-5 lg:py-0 flex-1 min-w-0 justify-center gap-4">
          <div className="flex items-center justify-center gap-5">
            <div className="w-28 h-28 rounded-xl shrink-0 overflow-hidden">
              {meta?.image ? (
                <img src={meta.image} alt={name} className="w-full h-full object-contain scale-[3] -translate-y-[8px]" />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">?</div>
              )}
            </div>

            <div className="min-w-0 shrink-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                {meta?.world && (
                  <img
                    src={`/worlds/${assetSlug(meta.world.startsWith('챌린저스') ? '챌린저스' : meta.world)}.webp`}
                    alt=""
                    className="w-4 h-4 object-contain shrink-0 -mr-0.5"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
                <p className="text-base font-bold text-gray-900 dark:text-zinc-100">{name}</p>
                {meta?.world && <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{meta.world}</span>}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex gap-2">
                  <span className="w-6 text-gray-400 dark:text-zinc-500 shrink-0">레벨</span>
                  <span className="text-gray-700 dark:text-zinc-300">
                    {level}
                    {todayData
                      ? <span className="text-gray-400 dark:text-zinc-500 ml-1">({todayData.expRate.toFixed(3)}%)</span>
                      : !hasApi && meta?.manualExpRate != null
                        ? <span className="text-gray-400 dark:text-zinc-500 ml-1">({meta.manualExpRate.toFixed(3)}%)</span>
                        : null
                    }
                  </span>
                </div>
                {meta !== null && (
                  <div className="flex gap-2">
                    <span className="w-6 text-gray-400 dark:text-zinc-500 shrink-0">길드</span>
                    {meta.guild
                      ? <span className="text-gray-700 dark:text-zinc-300">{meta.guild}</span>
                      : <span className="text-gray-400 dark:text-zinc-500">없음</span>
                    }
                  </div>
                )}
                {meta?.class && (
                  <div className="flex gap-2">
                    <span className="w-6 text-gray-400 dark:text-zinc-500 shrink-0">직업</span>
                    <span className="text-gray-700 dark:text-zinc-300">{meta.class}</span>
                  </div>
                )}
                {meta?.unionLevel != null && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 dark:text-zinc-500 shrink-0 whitespace-nowrap">유뇬</span>
                    <span className="text-gray-700 dark:text-zinc-300">{meta.unionLevel.toLocaleString('ko-KR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {ranking && (ranking.overall !== null || ranking.world !== null || ranking.class !== null) && (
            <div className="flex justify-center gap-4 text-[11px] text-gray-400 dark:text-zinc-500">
              {ranking.overall !== null && <span>종합 <span className="text-gray-800 dark:text-zinc-100">{ranking.overall.toLocaleString('ko-KR')}위</span></span>}
              {ranking.world !== null && <span>월드 <span className="text-gray-800 dark:text-zinc-100">{ranking.world.toLocaleString('ko-KR')}위</span></span>}
              {ranking.class !== null && <span>직업 <span className="text-gray-800 dark:text-zinc-100">{ranking.class.toLocaleString('ko-KR')}위</span></span>}
            </div>
          )}
        </div>

        <div className="h-px lg:h-auto w-auto lg:w-px bg-gray-100 dark:bg-zinc-700 mx-4 lg:mx-0 lg:my-4" />

        {/* 우측: 경험치 히스토리 */}
        <div className="w-full lg:w-[44%] lg:shrink-0 px-5 py-2 min-w-0 flex flex-col justify-center">
          {/* 타이틀을 막대 영역과 동일한 px-2 + max-w-[234px] mx-auto 컨텍스트에 넣어 가장 왼쪽 막대에 정렬 */}
          <div className="px-2 mb-2 mt-4">
            <p className="text-xs text-gray-700 dark:text-zinc-500 max-w-[234px] mx-auto">
              경험치 히스토리(7일)
              {!hasApi && <span className="ml-1 text-gray-300 dark:text-zinc-600">· API 미연동</span>}
            </p>
          </div>

          {!hasApi ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-300 dark:text-zinc-600 text-center leading-relaxed">
              수동 추가된 캐릭터는<br />히스토리를 불러올 수 없습니다
            </div>
          ) : loading && history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">
              불러오는 중...
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500 text-center leading-relaxed">
              데이터를 불러올 수 없습니다
            </div>
          ) : (
            <div className="relative pt-3 mb-3 px-2">
              <div className="flex items-end gap-1 h-[100px] justify-between max-w-[234px] mx-auto">
                {slots.map((slot, i) => {
                  const prev = i > 0 ? slots[i - 1] : null;
                  const { deltaRate, deltaExp } = computeDelta(prev, slot);
                  const barTip = slot.expRate !== null ? (
                    <>
                      <div className="text-orange-200">{formatDateKR(slot.date)}</div>
                      <div><span className="text-orange-300">Lv.{slot.level}</span> {slot.expRate.toFixed(3)}% <span className="text-red-400">({deltaRate >= 0 ? '+' : ''}{deltaRate.toFixed(3)}%)</span></div>
                      <div><span className="text-gray-300">획득</span> {formatExpKR(Math.max(deltaExp, 0))}</div>
                    </>
                  ) : null;
                  return (
                  <TooltipWrapper
                    key={slot.date}
                    className="flex-1 min-w-0 max-w-[30px]"
                    tipClassName="leading-relaxed flex flex-col items-start"
                    tip={barTip}
                    followCursor
                  >
                  <div className="flex flex-col items-center gap-1 w-full relative cursor-pointer">
                    <div className="w-full relative flex items-end" style={{ height: 74 }}>
                      {slot.expRate !== null ? (
                        <>
                          {slot.level !== null && (i === 0 || slots.slice(0, i).reverse().find(s => s.level !== null)?.level !== slot.level) && (
                            <span
                              className="absolute left-0 right-0 text-center text-[8px] text-gray-900 dark:text-white leading-none pointer-events-none"
                              style={{ bottom: Math.max((slot.expRate / 100) * 74, 2) + 12 }}
                            >
                              {slot.level}
                            </span>
                          )}
                          <span
                            className="absolute left-0 right-0 text-center text-[8px] text-gray-500 dark:text-zinc-400 leading-none pointer-events-none"
                            style={{ bottom: Math.max((slot.expRate / 100) * 74, 2) + 2 }}
                          >
                            {slot.expRate.toFixed(1)}%
                          </span>
                          <div
                            className="w-full rounded-t bg-orange-400 dark:bg-orange-500 transition-all"
                            style={{ height: Math.max((slot.expRate / 100) * 74, 2) }}
                          />
                        </>
                      ) : (
                        <div className="w-full" />
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-zinc-500 truncate w-full text-center">
                      {formatDate(slot.date)}
                    </span>
                  </div>
                  </TooltipWrapper>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
