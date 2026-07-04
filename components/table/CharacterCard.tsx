'use client';

import CardHeader from '@/components/ui/CardHeader';

import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { LEVEL_EXP } from '@/data/levelExp';
import type { CharMeta } from '@/types';

export interface HistoryPoint {
  date: string;
  expRate: number;
  level: number;
  exp?: number;
}

interface Slot {
  date: string;
  expRate: number | null;
  level: number | null;
  exp: number | null;
}

export interface Ranking {
  overall: number | null;
  world: number | null;
  class: number | null;
}

interface Props {
  name: string;
  level: number;
  meta: CharMeta | null;
  isEmpty?: boolean;
  history: HistoryPoint[];
  ranking: Ranking | null;
  loading: boolean;
}

function kstDate(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return kst.toISOString().slice(0, 10);
}

function getDisplayDates(): string[] {
  return Array.from({ length: 7 }, (_, i) => kstDate(6 - i));
}

function computeSlots(points: HistoryPoint[]): Slot[] {
  const map = new Map(points.map(p => [p.date, p]));
  return getDisplayDates().map(date => {
    const p = map.get(date);
    return { date, expRate: p?.expRate ?? null, level: p?.level ?? null, exp: p?.exp ?? null };
  });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${days[d.getUTCDay()]}요일`;
}

function formatExpKR(exp: number): string {
  if (exp === 0) return '0';
  const jo = Math.floor(exp / 1_000_000_000_000);
  const eok = Math.floor((exp % 1_000_000_000_000) / 100_000_000);
  const man = Math.floor((exp % 100_000_000) / 10_000);
  const rest = exp % 10_000;
  const parts: string[] = [];
  if (jo > 0) parts.push(`${jo}조`);
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);
  if (rest > 0) parts.push(String(rest));
  return parts.join(' ');
}

// 두 슬롯 사이 경험치 증가량 계산 (레벨업 가로질러 반영)
// character_exp는 현재 레벨 내 누적치라 레벨업 시 리셋되므로, levelExp 테이블로 보정한다.
function computeDelta(prev: Slot | null, slot: Slot): { deltaRate: number; deltaExp: number } {
  if (prev?.expRate == null || slot.expRate == null) return { deltaRate: 0, deltaExp: 0 };
  const l1 = prev.level, l2 = slot.level;
  const p1 = prev.expRate, p2 = slot.expRate;

  // 레벨 정보가 없거나 동일 레벨: 단순 차이
  if (l1 == null || l2 == null || l1 === l2) {
    const deltaExp = slot.exp != null && prev.exp != null ? slot.exp - prev.exp : 0;
    return { deltaRate: p2 - p1, deltaExp };
  }

  // 레벨이 내려간 비정상 케이스: 폴백
  if (l2 < l1) return { deltaRate: p2 - p1, deltaExp: 0 };

  // 레벨업: (어제 레벨 잔여%) + (중간 레벨 100%씩) + (오늘 레벨%)
  const deltaRate = (100 - p1) + 100 * (l2 - l1 - 1) + p2;

  let deltaExp = 0;
  if (slot.exp != null && prev.exp != null) {
    const req1 = LEVEL_EXP[l1]?.required;
    if (req1 != null) {
      deltaExp = req1 - prev.exp; // 어제 레벨 마무리분
      for (let L = l1 + 1; L < l2; L++) deltaExp += LEVEL_EXP[L]?.required ?? 0; // 중간 레벨 전체
      deltaExp += slot.exp; // 오늘 레벨 누적분
    }
  }
  return { deltaRate, deltaExp };
}

export default function CharacterCard({ name, level, meta, isEmpty, history, ranking, loading }: Props) {
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
      <CardHeader title="캐릭터 정보" />

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
                    src={`/worlds/${encodeURIComponent(meta.world.startsWith('챌린저스') ? '챌린저스' : meta.world)}.webp`}
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
          <p className="text-xs text-gray-700 dark:text-zinc-500 mb-2 mt-4 px-2">
            경험치 히스토리(7일)
            {!hasApi && <span className="ml-1 text-gray-300 dark:text-zinc-600">· API 미연동</span>}
          </p>

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
                  <div
                    className="flex flex-col items-center gap-1 w-full relative cursor-pointer"
                  >
                    <div className="w-full relative flex items-end" style={{ height: 84 }}>
                      {slot.expRate !== null ? (
                        <>
                          {slot.level !== null && (i === 0 || slots.slice(0, i).reverse().find(s => s.level !== null)?.level !== slot.level) && (
                            <span
                              className="absolute left-0 right-0 text-center text-[8px] text-gray-900 dark:text-white leading-none pointer-events-none"
                              style={{ bottom: Math.max((slot.expRate / 100) * 84, 2) + 12 }}
                            >
                              {slot.level}
                            </span>
                          )}
                          <span
                            className="absolute left-0 right-0 text-center text-[8px] text-gray-500 dark:text-zinc-400 leading-none pointer-events-none"
                            style={{ bottom: Math.max((slot.expRate / 100) * 84, 2) + 2 }}
                          >
                            {slot.expRate.toFixed(1)}%
                          </span>
                          <div
                            className="w-full rounded-t bg-orange-400 dark:bg-orange-500 transition-all"
                            style={{ height: Math.max((slot.expRate / 100) * 84, 2) }}
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
