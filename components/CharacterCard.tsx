'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharMeta } from '@/types';
import TooltipWrapper from '@/components/TooltipWrapper';
import { LEVEL_EXP } from '@/data/levelExp';

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

interface Ranking {
  overall: number | null;
  world: number | null;
  class: number | null;
}

interface Props {
  name: string;
  level: number;
  meta: CharMeta | null;
  onMetaUpdate?: (patch: Partial<CharMeta>) => void;
  onTodayLoaded?: (expRate: number | null) => void;
  onCharLevelUpdate?: (level: number) => void;
  isEmpty?: boolean;
}

const CHAR_CACHE_KEY = (ocid: string) => `maple-char-${ocid}`;
const REFRESH_COOLDOWN = 1 * 60 * 1000; // 1분


function formatLastUpdated(savedAt: number): string {
  const diff = Math.floor((Date.now() - savedAt) / 1000);
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
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

export default function CharacterCard({ name, level, meta, onMetaUpdate, onTodayLoaded, onCharLevelUpdate, isEmpty }: Props) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [ranking, setRanking] = useState<Ranking | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string | null>(null);

  const refreshingRef = useRef(false);
  const lastRefreshedAtRef = useRef<number | null>(null);
  const refreshedAtMap = useRef<Record<string, number>>({});

  const hasApi = !!meta?.ocid;
  const today = kstDate(0);
  const todayData = history.find(p => p.date === today) ?? null;
  const slots = computeSlots(history);

  // 새로고침 — 히스토리 + 랭킹 전체 fetch
  const doRefresh = useCallback(async () => {
    if (!meta?.ocid || refreshingRef.current) return;
    if (lastRefreshedAtRef.current !== null && Date.now() - lastRefreshedAtRef.current < REFRESH_COOLDOWN) return;

    const ocid = meta.ocid;
    setRefreshing(true);

    try {
      const rankParams = new URLSearchParams({ ocid });
      if (meta.world) rankParams.set('world', meta.world);
      if (meta.class) rankParams.set('class', meta.class);

      const [histData, rankData, imageData, skillData] = await Promise.all([
        fetch(`/api/character/history?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character/ranking?${rankParams}`).then(r => r.json()),
        fetch(`/api/character?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character/skill?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
      ]);

      const isSuccess = Array.isArray(histData);
      const hist: HistoryPoint[] = isSuccess ? histData : [];
      const rank: Ranking | null = rankData ?? null;
      const todayPoint = hist.find(p => p.date === kstDate(0)) ?? null;

      setHistory(hist);
      setRanking(rank);
      onTodayLoaded?.(todayPoint?.expRate ?? null);

      if (isSuccess) {
        const savedAt = Date.now();
        refreshedAtMap.current[ocid] = savedAt;
        setLastRefreshedAt(savedAt);
        setLastUpdatedLabel('방금 전');

        if (onMetaUpdate) {
          const metaUpdate: Record<string, unknown> = { imageUpdatedAt: savedAt, skillUpdatedAt: savedAt };
          if (imageData?.image !== undefined) metaUpdate.image = imageData.image;
          if (imageData?.class !== undefined) metaUpdate.class = imageData.class;
          if (imageData?.world !== undefined) metaUpdate.world = imageData.world;
          if (imageData?.guild !== undefined) metaUpdate.guild = imageData.guild;
          if (skillData?.monsterParkBonus !== undefined) {
            metaUpdate.monsterParkBonus = skillData.monsterParkBonus;
            metaUpdate.epicDungeonBonus = skillData.epicDungeonBonus;
            metaUpdate.monsterParkBonuses = skillData.monsterParkBonuses ?? [];
            metaUpdate.epicDungeonBonuses = skillData.epicDungeonBonuses ?? [];
            metaUpdate.treasureBonus = skillData.treasureBonus;
            metaUpdate.treasureBonuses = skillData.treasureBonuses ?? [];
          }
          onMetaUpdate(metaUpdate);
        }
        if (onCharLevelUpdate && imageData?.level != null) {
          onCharLevelUpdate(imageData.level);
        }

        try {
          localStorage.setItem(CHAR_CACHE_KEY(ocid), JSON.stringify({ savedAt: Date.now(), history: hist, ranking: rank }));
        } catch {}
      }
    } catch {}
    finally {
      setRefreshing(false);
    }
  }, [meta?.ocid, meta?.world, meta?.class, onTodayLoaded, onMetaUpdate]);

  // ref 동기화 (렌더 중 즉시 할당)
  refreshingRef.current = refreshing;
  lastRefreshedAtRef.current = lastRefreshedAt;

  // 쿨다운 카운트다운
  useEffect(() => {
    if (lastRefreshedAt === null) return;
    const tick = () => {
      const left = Math.max(0, REFRESH_COOLDOWN - (Date.now() - lastRefreshedAt));
      setCooldownLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastRefreshedAt]);


  // 캐시 로드 (마운트/슬롯 전환 시) — 캐시 없으면 바로 fetch
  useEffect(() => {
    if (!meta?.ocid) {
      setHistory([]); setRanking(null); setLastRefreshedAt(null);
      onTodayLoaded?.(null);
      return;
    }
    const ocid = meta.ocid;

    try {
      const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid));
      if (raw) {
        const cache = JSON.parse(raw);
        const hist: HistoryPoint[] = cache.history ?? [];
        const todayPoint = hist.find(p => p.date === kstDate(0)) ?? null;
        setHistory(hist);
        setRanking(cache.ranking ?? null);
        // 이 세션에서 새로고침한 기록이 있으면 그 시간 우선, 없으면 캐시 savedAt
        const resolvedAt = refreshedAtMap.current[ocid] ?? cache.savedAt ?? null;
        lastRefreshedAtRef.current = resolvedAt;
        setLastRefreshedAt(resolvedAt);
        if (resolvedAt) setLastUpdatedLabel(formatLastUpdated(resolvedAt));
        onTodayLoaded?.(todayPoint?.expRate ?? null);
      } else {
        // 캐시 없는 새 슬롯 — 쿨다운 리셋 후 즉시 fetch
        lastRefreshedAtRef.current = null;
        setLastRefreshedAt(null);
        doRefresh();
      }
    } catch {}

  }, [meta?.ocid]);

  // 최근 업데이트 라벨 실시간 갱신 (1분마다)
  useEffect(() => {
    if (!lastRefreshedAt) return;
    const id = setInterval(() => {
      setLastUpdatedLabel(formatLastUpdated(lastRefreshedAt));
    }, 60_000);
    return () => clearInterval(id);
  }, [lastRefreshedAt]);


  // 새로고침 버튼 상태
  const canRefresh = !refreshing && cooldownLeft === 0;

  if (isEmpty) {
    return (
      <div className="character-card bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">캐릭터 정보</h3>
        </div>
        <div className="flex items-stretch h-[185px]">
          <div className="flex flex-col px-4 flex-1 pt-1 pb-5 items-center justify-center gap-3">
            <div className="w-24 h-24 rounded-xl shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">?</div>
            <p className="text-sm text-gray-400 dark:text-zinc-500">캐릭터를 추가해주세요</p>
          </div>
          <div className="w-px bg-gray-100 dark:bg-zinc-700 my-4" />
          <div className="w-[44%] shrink-0 px-5 py-2 min-w-0 flex flex-col">
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
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2 flex items-center justify-center">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">캐릭터 정보</h3>
      </div>

      <div className="relative flex items-stretch h-[185px]">
        {hasApi && (
          <div className="absolute top-2 left-2 z-10 flex items-start gap-1.5">
            <button
              onClick={doRefresh}
              disabled={!canRefresh}
              className="w-8 h-8 flex items-center justify-center rounded bg-orange-400 dark:bg-orange-500 text-white transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? (
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              )}
            </button>
            {lastUpdatedLabel && !refreshing && (
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">최근 업데이트: {lastUpdatedLabel}</span>
            )}
          </div>
        )}
        {/* 좌측: 캐릭터 정보 */}
        <div className="flex flex-col px-4 flex-1 pt-1 pb-5">
          <div className="flex items-center justify-center gap-5 flex-1">
            <div className="w-24 h-24 rounded-xl shrink-0 overflow-hidden">
              {meta?.image ? (
                <img src={meta.image} alt={name} className="w-full h-full object-contain scale-[3]" />
              ) : (
                <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl text-gray-300 dark:text-zinc-600">?</div>
              )}
            </div>

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
                {(() => {
                  const mpBonuses = meta?.monsterParkBonuses ?? [];
                  const epBonuses = meta?.epicDungeonBonuses ?? [];
                  const trBonuses = meta?.treasureBonuses ?? [];
                  const bonusMap = new Map<string, { name: string; icon?: string | null; mp?: number; ep?: number; tr?: number }>();
                  for (const b of mpBonuses) bonusMap.set(b.name, { name: b.name, icon: b.icon, mp: b.pct });
                  for (const b of epBonuses) {
                    const ex = bonusMap.get(b.name);
                    if (ex) ex.ep = b.pct;
                    else bonusMap.set(b.name, { name: b.name, icon: b.icon, ep: b.pct });
                  }
                  for (const b of trBonuses) {
                    const ex = bonusMap.get(b.name);
                    if (ex) ex.tr = b.pct;
                    else bonusMap.set(b.name, { name: b.name, icon: b.icon, tr: b.pct });
                  }
                  const mergedBonuses = Array.from(bonusMap.values());
                  if (mergedBonuses.length === 0) return null;
                  return (
                    <div className="flex gap-2 items-center mt-0.5">
                      <span className="w-6 text-gray-400 dark:text-zinc-500 shrink-0">보약</span>
                      <div className="flex items-center gap-1 flex-wrap cursor-default">
                        {mergedBonuses.map(b => (
                          <TooltipWrapper
                            key={b.name}
                            tipClassName="!whitespace-normal leading-relaxed"
                            tip={<>
                              <div className="text-orange-200 font-semibold mb-0.5">{b.name}</div>
                              {b.mp != null && <div className="text-gray-200">몬스터파크 경험치 <span className="text-orange-300">+{b.mp}%</span></div>}
                              {b.ep != null && <div className="text-gray-200">에픽 던전 기본 보상 <span className="text-orange-300">+{b.ep}%</span></div>}
                              {b.tr != null && <div className="text-gray-200">트레져 헌터 경험치 <span className="text-orange-300">+{b.tr}%</span></div>}
                            </>}
                          >
                            {b.icon
                              ? <img src={b.icon} alt={b.name} className="w-5 h-5 rounded block" />
                              : <span className="w-5 h-5 flex items-center justify-center text-[10px] font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-500 rounded">E</span>
                            }
                          </TooltipWrapper>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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

        <div className="w-px bg-gray-100 dark:bg-zinc-700 my-4" />

        {/* 우측: 경험치 히스토리 */}
        <div className="w-[44%] shrink-0 px-5 py-2 min-w-0 flex flex-col">
          <p className="text-xs text-gray-700 dark:text-zinc-500 mb-2 mt-3">
            경험치 히스토리 (7일)
            {!hasApi && <span className="ml-1 text-gray-300 dark:text-zinc-600">· API 미연동</span>}
          </p>

          {!hasApi ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-300 dark:text-zinc-600 text-center leading-relaxed">
              수동 추가된 캐릭터는<br />히스토리를 불러올 수 없습니다
            </div>
          ) : refreshing ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">
              불러오는 중...
            </div>
          ) : history.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500 text-center leading-relaxed">
              갱신 버튼을 눌러<br />데이터를 불러오세요
            </div>
          ) : (
            <div className="relative mt-auto pt-3 mb-1">
              <div className="flex items-end gap-0.5 h-[100px]">
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
                    className="flex-1 min-w-0"
                    tipClassName="!whitespace-normal leading-relaxed flex flex-col items-start"
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
