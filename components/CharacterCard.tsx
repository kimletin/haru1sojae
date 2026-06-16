'use client';

import { useEffect, useState } from 'react';
import type { CharMeta } from '@/types';

interface HistoryPoint {
  date: string;
  expRate: number;
  level: number;
}

interface Slot {
  date: string;
  expRate: number | null;
}

interface Props {
  name: string;
  level: number;
  meta: CharMeta | null;
}

const HIST_PAST_KEY = (ocid: string) => `maple-hist-past-${ocid}`;
const RANKING_KEY = (ocid: string) => `maple-ranking-${ocid}`;

interface Ranking {
  overall: number | null;
  world: number | null;
  class: number | null;
}

// Strict Mode 이중 호출 방지
const activeFetches = new Set<string>();

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
  return getDisplayDates().map(date => ({
    date,
    expRate: map.get(date)?.expRate ?? null,
  }));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export default function CharacterCard({ name, level, meta }: Props) {
  const [pastData, setPastData] = useState<HistoryPoint[]>([]);
  const [todayData, setTodayData] = useState<HistoryPoint | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const hasApi = !!meta?.ocid;

  const slots = computeSlots([...pastData, ...(todayData ? [todayData] : [])]);

  useEffect(() => {
    if (!meta?.ocid) return;
    const ocid = meta.ocid;

    // 과거 캐시 로드 (저장 날짜가 오늘과 같아야 유효)
    let pastCached: HistoryPoint[] | null = null;
    try {
      const raw = localStorage.getItem(HIST_PAST_KEY(ocid));
      if (raw) {
        const { savedDate, data } = JSON.parse(raw);
        if (savedDate === kstDate(0)) pastCached = data;
      }
    } catch {}

    setPastData(pastCached ?? []);
    setTodayData(null);
    setRanking(null);

    // 랭킹 캐시 로드 (오늘 날짜 유효)
    async function fetchRanking() {
      const rankKey = `${ocid}-ranking`;
      if (activeFetches.has(rankKey)) return;
      activeFetches.add(rankKey);
      try {
        // 캐시 확인
        const raw = localStorage.getItem(RANKING_KEY(ocid));
        if (raw) {
          const { savedDate, data } = JSON.parse(raw);
          if (savedDate === kstDate(0)) { setRanking(data); return; }
        }
        const params = new URLSearchParams({ ocid });
        if (meta?.world) params.set('world', meta.world);
        if (meta?.class) params.set('class', meta.class);
        const res = await fetch(`/api/character/ranking?${params}`);
        const data: Ranking = await res.json();
        setRanking(data);
        try { localStorage.setItem(RANKING_KEY(ocid), JSON.stringify({ savedDate: kstDate(0), data })); } catch {}
      } catch {} finally {
        activeFetches.delete(rankKey);
      }
    }

    fetchRanking();

    async function fetchToday() {
      const key = `${ocid}-today`;
      if (activeFetches.has(key)) return;
      activeFetches.add(key);
      try {
        const res = await fetch(`/api/character/history?ocid=${encodeURIComponent(ocid)}&todayOnly=true`);
        const data: HistoryPoint[] = await res.json();
        if (Array.isArray(data) && data.length > 0) setTodayData(data[0]);
      } catch {} finally {
        activeFetches.delete(key);
      }
    }

    async function initFull() {
      if (activeFetches.has(ocid)) return;
      activeFetches.add(ocid);
      setLoadingHist(true);
      try {
        const res = await fetch(`/api/character/history?ocid=${encodeURIComponent(ocid)}`);
        const data: HistoryPoint[] = await res.json();
        if (Array.isArray(data)) {
          const today = kstDate(0);
          const past = data.filter(p => p.date !== today);
          const todayPoint = data.find(p => p.date === today) ?? null;
          try { localStorage.setItem(HIST_PAST_KEY(ocid), JSON.stringify({ savedDate: today, data: past })); } catch {}
          setPastData(past);
          if (todayPoint) setTodayData(todayPoint);
        }
      } finally {
        activeFetches.delete(ocid);
        setLoadingHist(false);
      }
    }

    if (pastCached) {
      setLoadingHist(true);
      fetchToday().finally(() => setLoadingHist(false));
    } else {
      initFull();
    }
  }, [meta?.ocid]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">캐릭터 정보</h3>
      </div>
      <div className="flex items-stretch">
        {/* 좌측: 캐릭터 정보 */}
        <div className="flex items-center gap-3 p-4 w-1/2">
          {meta?.image ? (
            <div className="w-32 h-40 overflow-hidden shrink-0">
              <img src={meta.image} alt={name} className="w-full h-full object-contain scale-[2.8] -translate-y-4" />
            </div>
          ) : (
            <div className="w-32 h-40 rounded-lg bg-gray-100 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">
              ?
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">{name}</p>
              {meta?.world && <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{meta.world}</span>}
            </div>
            <div className="text-xs space-y-0.5">
              <div className="flex gap-2">
                <span className="text-gray-400 dark:text-zinc-500 shrink-0">레벨</span>
                <span className="text-gray-700 dark:text-zinc-300">
                  {level}
                  {todayData && <span className="text-gray-400 dark:text-zinc-500 ml-1">({todayData.expRate.toFixed(3)}%)</span>}
                </span>
              </div>
              {meta?.guild && (
                <div className="flex gap-2">
                  <span className="text-gray-400 dark:text-zinc-500 shrink-0">길드</span>
                  <span className="text-gray-700 dark:text-zinc-300">{meta.guild}</span>
                </div>
              )}
              {meta?.class && (
                <div className="flex gap-2">
                  <span className="text-gray-400 dark:text-zinc-500 shrink-0">직업</span>
                  <span className="text-gray-700 dark:text-zinc-300">{meta.class}</span>
                </div>
              )}
              {ranking && (
                <>
                  {ranking.overall !== null && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 dark:text-zinc-500 shrink-0">종합</span>
                      <span className="text-gray-700 dark:text-zinc-300">{ranking.overall.toLocaleString('ko-KR')}위</span>
                    </div>
                  )}
                  {ranking.world !== null && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 dark:text-zinc-500 shrink-0">월드</span>
                      <span className="text-gray-700 dark:text-zinc-300">{ranking.world.toLocaleString('ko-KR')}위</span>
                    </div>
                  )}
                  {ranking.class !== null && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 dark:text-zinc-500 shrink-0">직업</span>
                      <span className="text-gray-700 dark:text-zinc-300">{ranking.class.toLocaleString('ko-KR')}위</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-px bg-gray-100 dark:bg-zinc-700 my-4" />

        {/* 우측: 경험치 히스토리 */}
        <div className="w-1/2 p-4 min-w-0">
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2">
            경험치 히스토리 (7일)
            {!hasApi && <span className="ml-1 text-gray-300 dark:text-zinc-600">· API 미연동</span>}
            {loadingHist && <span className="ml-1">불러오는 중...</span>}
          </p>

          {!hasApi ? (
            <div className="h-16 flex items-center justify-center text-xs text-gray-300 dark:text-zinc-600">
              수동 추가된 캐릭터는 히스토리를 불러올 수 없습니다
            </div>
          ) : (
            <div className="flex items-end gap-1 h-36">
              {slots.map((slot) => (
                <div key={slot.date} className="flex flex-col items-center gap-1 flex-1 min-w-0 relative">
                  <div className="w-full relative flex items-end" style={{ height: 112 }}>
                    {slot.expRate !== null ? (
                      <>
                        <span
                          className="absolute left-0 right-0 text-center text-[8px] text-gray-500 dark:text-zinc-400 leading-none pointer-events-none"
                          style={{ bottom: Math.max((slot.expRate / 100) * 112, 2) + 2 }}
                        >
                          {slot.expRate.toFixed(1)}%
                        </span>
                        <div
                          className="w-full rounded-t bg-orange-400 dark:bg-orange-500 transition-all"
                          style={{ height: Math.max((slot.expRate / 100) * 112, 2) }}
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
