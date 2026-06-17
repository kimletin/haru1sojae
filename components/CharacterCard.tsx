'use client';

import { useEffect, useRef, useState } from 'react';
import type { CharMeta } from '@/types';

interface HistoryPoint {
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


interface Props {
  name: string;
  level: number;
  meta: CharMeta | null;
  onMetaUpdate?: (patch: Partial<CharMeta>) => void;
  onTodayLoaded?: (expRate: number) => void;
  isEmpty?: boolean;
}

const HIST_PAST_KEY = (ocid: string) => `maple-hist-past-${ocid}`;
const HIST_TODAY_KEY = (ocid: string) => `maple-hist-today-${ocid}`;
const RANKING_KEY = (ocid: string) => `maple-ranking-${ocid}`;
const TODAY_TTL_MS = 60 * 1000; // 1분

interface Ranking {
  overall: number | null;
  world: number | null;
  class: number | null;
}

// Strict Mode 이중 호출 방지
const activeFetches = new Set<string>();

// 세션 메모리 캐시 — 탭 전환 시 재호출 방지 (페이지 새로고침 시 초기화)
const sessionToday = new Map<string, HistoryPoint>();
const sessionRanking = new Map<string, Ranking>();
const sessionImage = new Map<string, string | null>();
const sessionSkill = new Map<string, { monsterParkBonus: number; epicDungeonBonus: number; monsterParkBonuses: { name: string; pct: number }[]; epicDungeonBonuses: { name: string; pct: number }[] }>();

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
    return {
      date,
      expRate: p?.expRate ?? null,
      level: p?.level ?? null,
      exp: p?.exp ?? null,
    };
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

export default function CharacterCard({ name, level, meta, onMetaUpdate, onTodayLoaded, isEmpty }: Props) {
  const [pastData, setPastData] = useState<HistoryPoint[]>([]);
  const [todayData, setTodayData] = useState<HistoryPoint | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [barTooltip, setBarTooltip] = useState<{ idx: number; x: number; y: number } | null>(null);
  const [boakTooltip, setBoakTooltip] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const hasApi = !!meta?.ocid;

  const slots = computeSlots([...pastData, ...(todayData ? [todayData] : [])]);

  // 바깥 터치 시 히스토리 툴팁 닫기
  useEffect(() => {
    if (barTooltip === null) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      if (chartRef.current && !chartRef.current.contains(e.target as Node)) setBarTooltip(null);
    };
    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [barTooltip]);

  // 이미지 조회 — 세션 캐시 우선, TTL 1분 (탭 전환은 세션 캐시로 차단)
  useEffect(() => {
    if (!meta?.ocid || !onMetaUpdate) return;
    const ocid = meta.ocid;

    if (sessionImage.has(ocid)) return;
    const age = meta.imageUpdatedAt ? Date.now() - meta.imageUpdatedAt : Infinity;
    if (age < 60_000) { sessionImage.set(ocid, meta.image ?? null); return; }

    const key = `${ocid}-image`;
    if (activeFetches.has(key)) return;
    activeFetches.add(key);

    fetch(`/api/character?ocid=${encodeURIComponent(ocid)}`)
      .then(r => r.json())
      .then(data => {
        if (data.image !== undefined) {
          sessionImage.set(ocid, data.image);
          onMetaUpdate({ image: data.image, imageUpdatedAt: Date.now() });
        }
      })
      .catch(() => {})
      .finally(() => activeFetches.delete(key));
  }, [meta?.ocid, meta?.imageUpdatedAt]);

  // 스킬 버프 조회 — 세션 캐시 우선, TTL 1분 (탭 전환은 세션 캐시로 차단)
  useEffect(() => {
    if (!meta?.ocid || !onMetaUpdate) return;
    const ocid = meta.ocid;

    if (sessionSkill.has(ocid)) return;
    const age = meta.skillUpdatedAt ? Date.now() - meta.skillUpdatedAt : Infinity;
    if (age < 60_000 && meta.monsterParkBonus !== null && meta.epicDungeonBonus !== null) {
      sessionSkill.set(ocid, {
        monsterParkBonus: meta.monsterParkBonus!,
        epicDungeonBonus: meta.epicDungeonBonus!,
        monsterParkBonuses: meta.monsterParkBonuses ?? [],
        epicDungeonBonuses: meta.epicDungeonBonuses ?? [],
      });
      return;
    }

    const key = `${ocid}-skill`;
    if (activeFetches.has(key)) return;
    activeFetches.add(key);

    fetch(`/api/character/skill?ocid=${encodeURIComponent(ocid)}`)
      .then(r => r.json())
      .then(data => {
        if (data.monsterParkBonus !== undefined && data.epicDungeonBonus !== undefined) {
          sessionSkill.set(ocid, data);
          onMetaUpdate({
            monsterParkBonus: data.monsterParkBonus,
            epicDungeonBonus: data.epicDungeonBonus,
            monsterParkBonuses: data.monsterParkBonuses ?? [],
            epicDungeonBonuses: data.epicDungeonBonuses ?? [],
            skillUpdatedAt: Date.now(),
          });
        }
      })
      .catch(() => {})
      .finally(() => activeFetches.delete(key));
  }, [meta?.ocid, meta?.skillUpdatedAt]);

  useEffect(() => {
    if (!meta?.ocid) {
      setPastData([]);
      setTodayData(null);
      setRanking(null);
      return;
    }
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

    // 세션 캐시 확인 — 탭 전환 시 재호출 방지
    const cachedToday = sessionToday.get(ocid);
    const cachedRanking = sessionRanking.get(ocid);
    if (cachedToday) setTodayData(cachedToday); else setTodayData(null);
    if (cachedRanking) setRanking(cachedRanking); else setRanking(null);

    if (cachedToday && cachedRanking) return; // 세션 캐시 완전히 유효 → API 호출 불필요

    // 랭킹
    async function fetchRanking() {
      const rankKey = `${ocid}-ranking`;
      if (activeFetches.has(rankKey)) return;
      activeFetches.add(rankKey);
      try {
        const raw = localStorage.getItem(RANKING_KEY(ocid));
        if (raw) {
          const { savedDate, data } = JSON.parse(raw);
          if (savedDate === kstDate(0)) { setRanking(data); sessionRanking.set(ocid, data); return; }
        }
        const params = new URLSearchParams({ ocid });
        if (meta?.world) params.set('world', meta.world);
        if (meta?.class) params.set('class', meta.class);
        const res = await fetch(`/api/character/ranking?${params}`);
        const data: Ranking = await res.json();
        setRanking(data);
        sessionRanking.set(ocid, data);
        try { localStorage.setItem(RANKING_KEY(ocid), JSON.stringify({ savedDate: kstDate(0), data })); } catch {}
      } catch {} finally {
        activeFetches.delete(rankKey);
      }
    }

    if (!cachedRanking) fetchRanking();

    // 오늘 경험치 TTL 캐시 확인
    let todayCached: HistoryPoint | null = null;
    try {
      const raw = localStorage.getItem(HIST_TODAY_KEY(ocid));
      if (raw) {
        const { savedAt, data } = JSON.parse(raw);
        if (Date.now() - savedAt < TODAY_TTL_MS) todayCached = data;
      }
    } catch {}

    if (todayCached) {
      setTodayData(todayCached);
      sessionToday.set(ocid, todayCached);
      onTodayLoaded?.(todayCached.expRate);
    }

    async function fetchToday() {
      const key = `${ocid}-today`;
      if (activeFetches.has(key)) return;
      activeFetches.add(key);
      try {
        const res = await fetch(`/api/character/history?ocid=${encodeURIComponent(ocid)}&todayOnly=true`);
        const data: HistoryPoint[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setTodayData(data[0]);
          sessionToday.set(ocid, data[0]);
          onTodayLoaded?.(data[0].expRate);
          try { localStorage.setItem(HIST_TODAY_KEY(ocid), JSON.stringify({ savedAt: Date.now(), data: data[0] })); } catch {}
        }
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
          if (todayPoint) {
            setTodayData(todayPoint);
            sessionToday.set(ocid, todayPoint);
            onTodayLoaded?.(todayPoint.expRate);
            try { localStorage.setItem(HIST_TODAY_KEY(ocid), JSON.stringify({ savedAt: Date.now(), data: todayPoint })); } catch {}
          }
        }
      } finally {
        activeFetches.delete(ocid);
        setLoadingHist(false);
      }
    }

    if (pastCached) {
      if (!cachedToday && !todayCached) {
        setLoadingHist(true);
        fetchToday().finally(() => setLoadingHist(false));
      }
    } else if (!cachedToday) {
      initFull();
    }
  }, [meta?.ocid]);

  if (isEmpty) {
    return (
      <div className="character-card bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">캐릭터 정보</h3>
        </div>
        <div className="flex items-stretch h-[185px]">
          {/* 좌측: 빈 캐릭터 */}
          <div className="flex flex-col px-4 flex-1 pt-1 pb-5 items-center justify-center gap-3">
            <div className="w-24 h-24 rounded-xl shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">?</div>
            <p className="text-sm text-gray-400 dark:text-zinc-500">캐릭터를 추가해주세요</p>
          </div>
          <div className="w-px bg-gray-100 dark:bg-zinc-700 my-4" />
          {/* 우측: 빈 히스토리 */}
          <div className="w-[44%] shrink-0 px-5 py-2 min-w-0 flex flex-col">
            <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2 mt-3">경험치 히스토리 (7일)</p>
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
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">캐릭터 정보</h3>
      </div>
      <div className="flex items-stretch h-[185px]">
        {/* 좌측: 캐릭터 정보 */}
        <div className="flex flex-col px-4 flex-1 pt-1 pb-5">
          {/* 이미지 + 정보 (세로 중앙) */}
          <div className="flex items-center justify-center gap-5 flex-1">
            {/* 이미지 */}
            <div className="w-24 h-24 rounded-xl shrink-0 overflow-hidden">
              {meta?.image ? (
                <img src={meta.image} alt={name} className="w-full h-full object-contain scale-[3]" />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">?</div>
              )}
            </div>

            {/* 정보 */}
            <div className="min-w-0 shrink-0">
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <p className="text-base font-bold text-gray-900 dark:text-zinc-100">{name}</p>
                {meta?.world && <span className="text-xs text-gray-400 dark:text-zinc-500 shrink-0">{meta.world}</span>}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="flex gap-2">
                  <span className="w-6 text-gray-400 dark:text-zinc-500 shrink-0">레벨</span>
                  <span className="text-gray-700 dark:text-zinc-300">
                    {level}
                    {todayData && <span className="text-gray-400 dark:text-zinc-500 ml-1">({todayData.expRate.toFixed(3)}%)</span>}
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
                {(() => {
                  const all = [...(meta?.monsterParkBonuses ?? []), ...(meta?.epicDungeonBonuses ?? [])];
                  if (all.length === 0) return null;
                  return (
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="w-6 text-gray-400 dark:text-zinc-500 shrink-0">보약</span>
                      <div
                        className="flex items-center gap-1 flex-wrap cursor-default"
                        onMouseEnter={e => setBoakTooltip({ x: e.clientX, y: e.clientY })}
                        onMouseMove={e => setBoakTooltip(v => v ? { ...v, x: e.clientX, y: e.clientY } : v)}
                        onMouseLeave={() => setBoakTooltip(null)}
                      >
                        {all.filter(b => b.icon).map(b => (
                          <img key={b.name} src={b.icon!} alt={b.name} className="w-5 h-5 rounded" />
                        ))}
                        {all.some(b => !b.icon) && (
                          <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-500 rounded">E</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 랭킹 — 카드 맨 아래 일렬 */}
          {ranking && (ranking.overall !== null || ranking.world !== null || ranking.class !== null) && (
            <div className="flex justify-center gap-4 text-[11px] text-gray-400 dark:text-zinc-500">
              {ranking.overall !== null && <span>종합 <span className="text-gray-800 dark:text-zinc-100">{ranking.overall.toLocaleString('ko-KR')}위</span></span>}
              {ranking.world !== null && <span>월드 <span className="text-gray-800 dark:text-zinc-100">{ranking.world.toLocaleString('ko-KR')}위</span></span>}
              {ranking.class !== null && <span>직업 <span className="text-gray-800 dark:text-zinc-100">{ranking.class.toLocaleString('ko-KR')}위</span></span>}
            </div>
          )}
        </div>

        <div className="w-px bg-gray-100 dark:bg-zinc-700 my-4" />

        {/* 우측: 경험치 히스토리 */}
        <div className="w-[44%] shrink-0 px-5 py-2 min-w-0 flex flex-col">
          <p className="text-xs text-gray-400 dark:text-zinc-500 mb-2 mt-3">
            경험치 히스토리 (7일)
            {!hasApi && <span className="ml-1 text-gray-300 dark:text-zinc-600">· API 미연동</span>}
          </p>

          {!hasApi ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-300 dark:text-zinc-600 text-center leading-relaxed">
              수동 추가된 캐릭터는<br />히스토리를 불러올 수 없습니다
            </div>
          ) : loadingHist ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">
              불러오는 중...
            </div>
          ) : (
            <div ref={chartRef} className="relative mt-auto pt-3 mb-1">
              <div className="flex items-end gap-0.5 h-[100px]">
                {slots.map((slot, i) => (
                  <div
                    key={slot.date}
                    className="flex flex-col items-center gap-1 flex-1 min-w-0 relative cursor-pointer"
                    onMouseEnter={e => slot.expRate !== null && setBarTooltip({ idx: i, x: e.clientX, y: e.clientY })}
                    onMouseMove={e => slot.expRate !== null && setBarTooltip(v => v ? { ...v, x: e.clientX, y: e.clientY } : v)}
                    onMouseLeave={() => setBarTooltip(null)}
                    onTouchStart={e => { e.stopPropagation(); setBarTooltip(v => v?.idx === i ? null : { idx: i, x: e.touches[0].clientX, y: e.touches[0].clientY }); }}
                  >
                    <div className="w-full relative flex items-end" style={{ height: 84 }}>
                      {slot.expRate !== null ? (
                        <>
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 보약 툴팁 */}
      {boakTooltip !== null && (() => {
        const mpBonuses = meta?.monsterParkBonuses ?? [];
        const epBonuses = meta?.epicDungeonBonuses ?? [];
        if (mpBonuses.length === 0 && epBonuses.length === 0) return null;
        return (
          <div
            style={{ position: 'fixed', left: boakTooltip.x + 14, top: boakTooltip.y + 14 }}
            className="bg-gray-800 text-white text-[11px] rounded-lg px-2.5 py-2 z-50 pointer-events-none whitespace-nowrap leading-relaxed shadow-lg"
          >
            {mpBonuses.map((b, i) => (
              <div key={b.name} className={i > 0 ? 'mt-1.5' : ''}>
                <div className="text-orange-200 font-semibold">{b.name}</div>
                <div className="text-gray-200">몬스터파크 경험치 <span className="text-orange-300">+{b.pct}%</span></div>
              </div>
            ))}
            {epBonuses.map((b, i) => (
              <div key={b.name} className={mpBonuses.length > 0 || i > 0 ? 'mt-1.5' : ''}>
                <div className="text-orange-200 font-semibold">{b.name}</div>
                <div className="text-gray-200">에픽 던전 기본 보상 <span className="text-orange-300">+{b.pct}%</span></div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* 히스토리 바 툴팁 */}
      {barTooltip !== null && slots[barTooltip.idx].expRate !== null && (() => {
        const s = slots[barTooltip.idx];
        const prev = barTooltip.idx > 0 ? slots[barTooltip.idx - 1] : null;
        const deltaRate = prev?.expRate != null ? s.expRate! - prev.expRate : 0;
        const deltaExp = (s.exp != null && prev?.exp != null && s.level === prev?.level)
          ? s.exp - prev.exp : 0;
        return (
          <div
            style={{ position: 'fixed', left: barTooltip.x + 14, top: barTooltip.y + 14 }}
            className="bg-gray-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 z-50 pointer-events-none leading-relaxed flex flex-col items-start whitespace-nowrap shadow-lg"
          >
            <div className="text-orange-200">{formatDateKR(s.date)}</div>
            <div><span className="text-orange-300">Lv.{s.level}</span> {s.expRate!.toFixed(3)}% <span className="text-red-400">({deltaRate >= 0 ? '+' : ''}{deltaRate.toFixed(3)}%)</span></div>
            <div><span className="text-gray-300 dark:text-zinc-400">획득</span> {formatExpKR(Math.max(deltaExp, 0))}</div>
          </div>
        );
      })()}
    </div>
  );
}
