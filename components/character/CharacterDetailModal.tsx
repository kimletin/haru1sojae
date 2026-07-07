'use client';

import { useEffect } from 'react';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';
import { LEVEL_EXP } from '@/data/levelExp';
import {
  type HistoryPoint,
  type Ranking,
  type RankPoint,
  kstDate,
  computeSlots,
  computeDelta,
  formatDate,
  formatDateKR,
  formatExpKR,
} from '@/components/table/charHistoryUtils';

interface Props {
  name: string;
  history: HistoryPoint[];
  ranking: Ranking | null;
  onClose: () => void;
}

// 경험치 히스토리 15일 막대그래프 (툴팁: 커서 따라감)
function ExpHistory15({ history }: { history: HistoryPoint[] }) {
  const slots = computeSlots(history, 15);
  const H = 130;
  const gridVals = [100, 75, 50, 25, 0];

  // 오늘~14일 전 일일 획득 경험치 평균 (데이터가 있는 인접 날짜 쌍만 집계)
  let expSum = 0, expDays = 0;
  for (let i = 1; i < slots.length; i++) {
    if (slots[i - 1].expRate != null && slots[i].expRate != null) {
      expSum += Math.max(computeDelta(slots[i - 1], slots[i]).deltaExp, 0);
      expDays++;
    }
  }
  const avgExp = expDays > 0 ? Math.round(expSum / expDays) : null;

  const last = slots[slots.length - 1];
  const required = last.level != null ? (LEVEL_EXP[last.level]?.required ?? null) : null;
  // 하루 평균 경험치가 현재 레벨 경험치통에서 차지하는 비율(%)
  const avgExpPct = (avgExp != null && required != null && required > 0) ? (avgExp / required) * 100 : null;

  // 레벨업 예상일: (현재 레벨의 필요 경험치 - 현재 경험치) / 하루 평균 획득 경험치
  let daysToLevelUp: number | null = null;
  let levelUpDateLabel = '';
  if (avgExp != null && avgExp > 0 && required != null && last.exp != null) {
    const remaining = required - last.exp;
    if (remaining > 0) {
      daysToLevelUp = Math.ceil(remaining / avgExp);
      levelUpDateLabel = formatDateKR(kstDate(-daysToLevelUp)); // 예: 2026년 8월 7일 화요일
    }
  }

  return (
    <div className="px-1">
      {(avgExp !== null || daysToLevelUp !== null) && (
        <div className="mb-6">
          {avgExp !== null && (
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              하루 평균 경험치 <span className="text-gray-800 dark:text-zinc-100">{formatExpKR(avgExp)}</span>
              {avgExpPct !== null && <span className="text-red-500 dark:text-red-400"> (+{avgExpPct.toFixed(2)}%)</span>}
            </p>
          )}
          {daysToLevelUp !== null && (
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              예상 레벨업 날짜 <span className="text-gray-800 dark:text-zinc-100">{levelUpDateLabel}</span> <span className="text-orange-400 dark:text-orange-300">({daysToLevelUp}일 후)</span>
            </p>
          )}
        </div>
      )}
      <div className="relative pl-6" style={{ height: H }}>
        {/* 0/25/50/75/100% 가로 보조선 (막대 뒤) */}
        {gridVals.map(v => (
          <div
            key={v}
            className="absolute left-6 right-0 border-t border-dashed border-gray-200 dark:border-zinc-700"
            style={{ bottom: (v / 100) * H }}
          >
            <span className="absolute right-full pr-1 -translate-y-1/2 text-[8px] text-gray-300 dark:text-zinc-600 leading-none">{v}</span>
          </div>
        ))}
        {/* 막대 레이어 */}
        <div className="relative z-10 flex items-end gap-[4px] h-full">
        {slots.map((slot, i) => {
          const prev = i > 0 ? slots[i - 1] : null;
          const { deltaRate, deltaExp } = computeDelta(prev, slot);
          const tip = slot.expRate !== null ? (
            <>
              <div className="text-orange-200">{formatDateKR(slot.date)}</div>
              <div><span className="text-orange-300">Lv.{slot.level}</span> {slot.expRate.toFixed(3)}% <span className="text-red-400">({deltaRate >= 0 ? '+' : ''}{deltaRate.toFixed(3)}%)</span></div>
              <div><span className="text-gray-300">획득</span> {formatExpKR(Math.max(deltaExp, 0))}</div>
            </>
          ) : null;
          return (
            <TooltipWrapper
              key={slot.date}
              className="flex-1 min-w-0 flex items-end h-full"
              tipClassName="leading-relaxed flex flex-col items-start"
              tip={tip}
              followCursor
            >
              <div className="w-full flex items-end cursor-pointer" style={{ height: H }}>
                {slot.expRate !== null ? (
                  <div
                    className="w-full rounded-t bg-orange-400 dark:bg-orange-500 hover:bg-orange-500 dark:hover:bg-orange-400 transition-colors"
                    style={{ height: Math.max((slot.expRate / 100) * H, 2) }}
                  />
                ) : (
                  <div className="w-full" />
                )}
              </div>
            </TooltipWrapper>
          );
        })}
        {/* 라벨 레이어(경험치%·레벨) — 막대와 동일한 flex 구조를 그대로 겹쳐 위치를 맞춘다.
            position만 있고 z-index는 지정하지 않아(auto), 일반 막대보다는 위·툴팁(z-50)보다는 아래로 자연스럽게 쌓인다. */}
        <div className="absolute inset-0 flex items-end gap-[4px] h-full pointer-events-none">
          {slots.map((slot, i) => {
            if (slot.expRate === null) return <div key={slot.date} className="flex-1 min-w-0" />;
            const changed = slot.level !== null && (i === 0 || slots.slice(0, i).reverse().find(s => s.level !== null)?.level !== slot.level);
            const barTop = Math.max((slot.expRate / 100) * H, 2);
            return (
              <div key={slot.date} className="flex-1 min-w-0 relative h-full">
                {/* 경험치 % — lg 이상에서만, 막대 바로 위 (외부 캐릭터 카드와 동일) */}
                <div
                  className="hidden lg:flex absolute inset-x-0 justify-center text-[8px] text-gray-500 dark:text-zinc-400 leading-none whitespace-nowrap"
                  style={{ bottom: barTop + 2 }}
                >
                  <span>{slot.expRate.toFixed(1)}%</span>
                </div>
                {/* 레벨 — 레벨 변경 지점만. lg 미만: 막대 바로 위 / lg 이상: 경험치 % 위 */}
                {changed && (
                  <>
                    <div
                      className="lg:hidden absolute inset-x-0 flex justify-center text-[8px] text-gray-900 dark:text-white leading-none whitespace-nowrap"
                      style={{ bottom: barTop + 2 }}
                    >
                      <span>{slot.level}</span>
                    </div>
                    <div
                      className="hidden lg:flex absolute inset-x-0 justify-center text-[8px] text-gray-900 dark:text-white leading-none whitespace-nowrap"
                      style={{ bottom: barTop + 11 }}
                    >
                      <span>{slot.level}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>
      {/* x축 날짜 — 실제 날짜(M/D)를 이틀 간격으로 표기 */}
      <div className="flex gap-[4px] mt-1 pl-6">
        {slots.map((slot, i) => {
          const daysAgo = (slots.length - 1) - i; // 마지막(오늘)=0, 첫칸=14
          return (
            <span key={slot.date} className="flex-1 min-w-0 text-center text-[9px] text-gray-400 dark:text-zinc-500 whitespace-nowrap overflow-visible">
              {daysAgo % 2 === 0 ? formatDate(slot.date) : ''}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// 랭킹 추이 라인 차트 (한 종류). 순위 숫자가 작을수록 위로 그린다.
function RankTrend({ label, history }: { label: string; history: RankPoint[] }) {
  const W = 520, plotTop = 42, plotBottom = 70, dateY = 86, H = 96, padX = 44;
  const n = history.length;
  const valid = history
    .map((p, i) => ({ ...p, i }))
    .filter((p): p is { date: string; ranking: number; i: number } => p.ranking != null);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40 px-3 py-2">
      <div className="text-xs font-semibold text-gray-600 dark:text-zinc-300 mb-1">{label}</div>
      {valid.length === 0 ? (
        <div className="py-5 text-center text-xs text-gray-400 dark:text-zinc-500">데이터 없음</div>
      ) : (() => {
        const ranks = valid.map(p => p.ranking);
        const min = Math.min(...ranks);        // 가장 좋은(작은) 순위
        const max = Math.max(...ranks);
        const range = max - min || 1;
        const xFor = (i: number) => n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2);
        const yFor = (r: number) => plotTop + ((r - min) / range) * (plotBottom - plotTop);
        const linePts = valid.map(p => `${xFor(p.i).toFixed(1)},${yFor(p.ranking).toFixed(1)}`).join(' ');

        return (
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {valid.length >= 2 && (
              <polyline points={linePts} fill="none" stroke="#fb923c" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            )}
            {valid.map((p, vi) => {
              // 전일 대비 등하락 (직전 유효 데이터 기준). 음수 = 순위 상승.
              // 7일전(첫 점)·변동 없는 날 = "- 0"(회색)
              const prevRank = vi > 0 ? valid[vi - 1].ranking : null;
              const d = prevRank == null ? 0 : p.ranking - prevRank;
              const neutral = vi === 0 || d === 0;
              const deltaText = neutral ? '- 0' : `${d < 0 ? '▲' : '▼'} ${Math.abs(d).toLocaleString('ko-KR')}`;
              const deltaClass = neutral
                ? 'fill-gray-400 dark:fill-zinc-500'
                : d < 0 ? 'fill-green-600 dark:fill-green-400' : 'fill-red-500 dark:fill-red-400';
              return (
                <g key={p.date}>
                  <circle cx={xFor(p.i)} cy={yFor(p.ranking)} r={2.5} fill="#f97316" />
                  {/* 등락폭: 모바일·데스크톱에서 순위 숫자와의 간격이 다르게 필요해 breakpoint별로 별도 렌더 */}
                  <text x={xFor(p.i)} y={yFor(p.ranking) - 27} textAnchor="middle" className={`lg:hidden text-[14px] ${deltaClass}`}>
                    {deltaText}
                  </text>
                  <text x={xFor(p.i)} y={yFor(p.ranking) - 22} textAnchor="middle" className={`hidden lg:inline text-[10px] ${deltaClass}`}>
                    {deltaText}
                  </text>
                  <text x={xFor(p.i)} y={yFor(p.ranking) - 8} textAnchor="middle" fill="#ea580c" className="text-[15px] lg:text-[11px] dark:fill-orange-300">
                    {p.ranking.toLocaleString('ko-KR')}
                  </text>
                </g>
              );
            })}
            {history.map((p, i) => (
              <text key={p.date} x={xFor(i)} y={dateY} textAnchor="middle" className="text-[15px] lg:text-[11px] fill-gray-400 dark:fill-zinc-500">
                {formatDate(p.date)}
              </text>
            ))}
          </svg>
        );
      })()}
    </div>
  );
}

export default function CharacterDetailModal({ name, history, ranking, onClose }: Props) {
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);

  const hasHistory = history.length > 0;
  const currentLevel = hasHistory ? history[history.length - 1].level : null;
  const hasRankTrend = !!ranking && [ranking.overallHistory, ranking.worldHistory, ranking.classHistory]
    .some(h => (h ?? []).some(p => p.ranking != null));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-[520px] max-w-[95vw] max-h-[88vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">
            {currentLevel != null && <span className="text-orange-500">Lv.{currentLevel} </span>}{name}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
          >×</button>
        </div>

        <div className="flex flex-col gap-5">
          {/* 경험치 히스토리 (14일) */}
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300 mb-2">경험치 히스토리 (15일)</p>
            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/40 px-3 py-3">
              {hasHistory ? (
                <ExpHistory15 history={history} />
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">데이터를 불러올 수 없습니다</div>
              )}
            </div>
          </div>

          {/* 랭킹 추이 (7일) */}
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-zinc-300 mb-2">랭킹 히스토리 (7일)</p>
            {hasRankTrend ? (
              <div className="flex flex-col gap-2.5">
                <RankTrend label="종합 랭킹" history={ranking?.overallHistory ?? []} />
                <RankTrend label="월드 랭킹" history={ranking?.worldHistory ?? []} />
                <RankTrend label="직업 랭킹" history={ranking?.classHistory ?? []} />
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">데이터를 불러올 수 없습니다</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
