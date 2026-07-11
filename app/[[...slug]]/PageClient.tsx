'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { InputValues, MobGroup } from '@/types';
import { calcAllItems } from '@/lib/calculator';
import CharacterInfoModal from '@/components/character/CharacterInfoModal';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import RankingPanel from '@/components/table/RankingPanel';
import InputSummaryCard from '@/components/table/InputSummaryCard';
import EfficiencyTab from '@/components/table/EfficiencyTab';
import ExpInfoTab from '@/components/exp/ExpInfoTab';
import ExpContentsTab, { CONTENT_KEYS } from '@/components/expContents/ExpContentsTab';
import HuntingGroundTab from '@/components/hunt/HuntingGroundTab';
import InfoCenterTab from '@/components/info/InfoCenterTab';
import HomeCardSection from '@/components/home/HomeCardSection';
import PrivacyTab from '@/components/privacy/PrivacyTab';
import CharacterSearchModal, { type CharacterInfo } from '@/components/character/CharacterSearchModal';
import CharacterCard, { type HistoryPoint, type Ranking } from '@/components/table/CharacterCard';
import { SunIcon, MoonIcon, TabIcon } from '@/components/ui/Icons';
import type { CharMeta } from '@/types';
import { getDefaultHunting } from '@/data/huntingGrounds';
import { getMonsterParkZone } from '@/data/monsterPark';

// 세션 내 오늘 경험치 조회 완료된 ocid (새로고침 시 초기화)

const PRESETS_KEY = 'haru1sojae-presets';
const PRESET_NAMES_KEY = 'haru1sojae-preset-names';
const ACTIVE_PRESET_KEY = 'haru1sojae-active-preset';
const NUM_SLOTS_KEY = 'haru1sojae-num-slots';
const CHAR_META_KEY = 'haru1sojae-char-meta';
const NUM_PRESETS = 6;
const DEFAULT_NUM_SLOTS = 0;

const CHAR_CACHE_KEY = (ocid: string) => `maple-char-${ocid}`;
const REFRESH_COOLDOWN = 60 * 1000; // 1분 — 진입/F5/탭전환 시 이 시간 내면 재요청 안 함(성공·실패 공통)

function makeDefaultMetas(): (CharMeta | null)[] {
  return Array.from({ length: NUM_PRESETS }, () => null);
}

function loadMetas(): (CharMeta | null)[] {
  try {
    const saved = localStorage.getItem(CHAR_META_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === NUM_PRESETS) return parsed;
    }
  } catch {}
  return makeDefaultMetas();
}

const DEFAULT_INPUTS: InputValues = {
  waterBottleRate: 0,
  mesoMarketRate: 2280,
  charLevel: 260,
  monsterLevel: 260,
  dailySessions: 10,
  mobCount: 34,
  huntingRegion: '세르니움',
  huntingGround: '해변 암석 지대 1',
  huntingMobs: [{ level: 260, count: 34 }],
  boosterMonsterLevel: 260,
  booster30min: 3,
  eternal30min: 0,
  booster1day: 6,
  eternal1day: 0,
  price50: 1_000_000,
  price70: 6_000_000,
  price2x: 60_000_000,
  price3x: 130_000_000,
  price4x: 200_000_000,
  priceSmallBooster: 1_300_000,
  priceLargeBooster: 4_600_000,
  priceAzmos: 3_500_000,
  priceHunterTitle: 1_650_000_000,
  priceBloodRingMeso: 300_000_000,
  priceBoostringMeso: 450_000_000,
  priceJungpenMeso: 2_000_000_000,
  epicDungeonZone: '하이마운틴',
  monsterParkZone: '세르니움',
  boosterRate: 0.5,
};

const DEFAULT_NAMES = ['null', 'null', 'null', 'null', 'null', 'null'];

function makeDefaultPresets(): InputValues[] {
  return Array.from({ length: NUM_PRESETS }, () => ({ ...DEFAULT_INPUTS }));
}

function loadPresets(): { presets: InputValues[]; active: number; names: string[] } {
  try {
    const savedPresets = localStorage.getItem(PRESETS_KEY);
    const savedActive = parseInt(localStorage.getItem(ACTIVE_PRESET_KEY) ?? '0');
    const savedNames = localStorage.getItem(PRESET_NAMES_KEY);
    const active = isNaN(savedActive) ? 0 : Math.min(Math.max(0, savedActive), NUM_PRESETS - 1);
    const names: string[] = savedNames
      ? (() => { try { const p = JSON.parse(savedNames); return Array.isArray(p) && p.length === NUM_PRESETS ? p : [...DEFAULT_NAMES]; } catch { return [...DEFAULT_NAMES]; } })()
      : [...DEFAULT_NAMES];
    if (savedPresets) {
      const parsed = JSON.parse(savedPresets);
      if (Array.isArray(parsed) && parsed.length === NUM_PRESETS) {
        return { presets: parsed.map(p => (p ? { ...DEFAULT_INPUTS, ...p } : { ...DEFAULT_INPUTS })), active, names };
      }
    }
  } catch {}
  return { presets: makeDefaultPresets(), active: 0, names: [...DEFAULT_NAMES] };
}

function savePresets(presets: InputValues[]) {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

function saveNames(names: string[]) {
  try { localStorage.setItem(PRESET_NAMES_KEY, JSON.stringify(names)); } catch {}
}

const TABS = [
  '경험치 효율표',
  '경험치 컨텐츠',
  '경험치 정보',
  '사냥터 정보',
  '정보 센터',
] as const;
type Tab = typeof TABS[number];

const TAB_PARAM: Record<Tab, string> = {
  '경험치 효율표':  'table',
  '경험치 컨텐츠':  'cont',
  '경험치 정보':    'exp',
  '사냥터 정보':    'hunt',
  '정보 센터':      'info',
};
const PARAM_TO_TAB: Record<string, Tab> = Object.fromEntries(
  Object.entries(TAB_PARAM).map(([k, v]) => [v, k as Tab])
);

function kstToday(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function loadTodayExpRateFrom(meta: CharMeta | null | undefined): number | null {
  try {
    if (meta?.manualExpRate != null) return meta.manualExpRate;
    if (meta?.ocid) {
      // CharacterCard가 저장하는 키: maple-char-${ocid}
      const raw = localStorage.getItem(`maple-char-${meta.ocid}`);
      if (raw) {
        const { history } = JSON.parse(raw) as { history?: { date: string; expRate: number | null }[] };
        const todayPoint = history?.find(p => p.date === kstToday());
        if (todayPoint?.expRate != null) return todayPoint.expRate;
      }
    }
  } catch {}
  return null;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [inputs, setInputs] = useState<InputValues>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [presetNames, setPresetNames] = useState<string[]>([...DEFAULT_NAMES]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null); // 삽입 위치(0~numSlots)
  const [numSlots, setNumSlots] = useState(DEFAULT_NUM_SLOTS);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchModalTarget, setSearchModalTarget] = useState(0);
  const [charMetas, setCharMetas] = useState<(CharMeta | null)[]>(makeDefaultMetas());
  const [todayExpRate, setTodayExpRate] = useState<number | null>(null);
  const [initialContentKey, setInitialContentKey] = useState<string | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [isHome, setIsHome] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // 우측 메뉴 패널 (lg 미만 전용, 버튼으로만 열림)
  // 캐릭터 데이터(앱 레벨로 일원화) — 활성 캐릭터의 표시용 상태
  const [charHistory, setCharHistory] = useState<HistoryPoint[]>([]);
  const [charRanking, setCharRanking] = useState<Ranking | null>(null);
  const [charLoading, setCharLoading] = useState(false);
  const presetsRef = useRef<InputValues[]>(makeDefaultPresets());
  const activePresetRef = useRef(0);
  const charRefreshedAtMap = useRef<Record<string, number>>({});
  const charMetasRef = useRef<(CharMeta | null)[]>(charMetas);
  charMetasRef.current = charMetas;
  const refreshCharRef = useRef<(presetIdx: number) => void>(() => {});

  // URL → 화면 상태 매핑 (마운트 + 뒤로/앞으로 공용)
  const applyRoute = useCallback((pathname: string) => {
    const slug = pathname.replace(/^\//, '');
    const parts = slug.split('/');
    const tabSlug = parts[0];

    let tab: Tab | null = PARAM_TO_TAB[tabSlug] ?? PARAM_TO_TAB[slug] ?? null;
    // 서브 경로 검증: /cont/<유효키>만 허용, 그 외 추가 경로는 잘못된 주소로 처리
    if (tab && parts.length > 1) {
      if (tabSlug === 'cont' && parts.length === 2 && CONTENT_KEYS.includes(parts[1])) {
        setInitialContentKey(parts[1]);
      } else {
        tab = null;
      }
    }
    if (slug === '') {
      setIsHome(true); setIsPrivacy(false); setNotFound(false);
      document.title = '하루1소재';
    } else if (slug === 'privacy') {
      setIsPrivacy(true); setIsHome(false); setNotFound(false);
      document.title = '개인정보처리방침 | 하루1소재';
    } else if (tab) {
      setActiveTab(tab); setIsHome(false); setIsPrivacy(false); setNotFound(false);
      document.title = `${tab} | 하루1소재`;
    } else {
      setNotFound(true); setIsHome(false); setIsPrivacy(false);
      document.title = '페이지를 찾을 수 없습니다 | 하루1소재';
    }
  }, []);

  // 뒤로/앞으로 가기 시 URL에 맞춰 화면 동기화
  useEffect(() => {
    const onPop = () => applyRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [applyRoute]);

  useEffect(() => {
    applyRoute(window.location.pathname);

    const savedSlots = parseInt(localStorage.getItem(NUM_SLOTS_KEY) ?? '');
    if (!isNaN(savedSlots)) setNumSlots(Math.min(Math.max(savedSlots, 1), NUM_PRESETS));

    const metas = loadMetas();
    setCharMetas(metas);

    const { presets, active, names } = loadPresets();
    presetsRef.current = presets;
    activePresetRef.current = active;
    setActivePreset(active);
    setPresetNames(names);
    setInputs(presets[active]);

    // CharacterCard 없이도 todayExpRate 복원
    const rate = loadTodayExpRateFrom(metas[active]);
    if (rate != null) setTodayExpRate(rate);

    const saved = localStorage.getItem('maple-dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    setMounted(true);
  }, []);

  // 우측 메뉴 패널: lg 이상에서는 탭이 헤더에 바로 보이므로 토글 패널 개념이 없음 — 그 폭으로 넘어가면 강제로 닫는다
  // (자동으로 열리는 로직은 없음, lg 미만에서는 항상 버튼을 눌러야만 열림)
  useEffect(() => {
    const apply = () => { if (window.innerWidth >= 905) setMenuOpen(false); };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  useEffect(() => {
    if (isHome || isPrivacy || notFound) return;
    document.title = `${activeTab} | 하루1소재`;
  }, [activeTab, isHome, isPrivacy, notFound]);

  useEffect(() => {
    if (!mounted) return;
    const rate = loadTodayExpRateFrom(charMetas[activePreset]);
    setTodayExpRate(rate);
  }, [activePreset]);


  const handleTabChange = (tab: Tab) => {
    setNotFound(false);
    setIsPrivacy(false);
    setIsHome(false);
    setMenuOpen(false);
    setActiveTab(tab);
    document.title = `${tab} | 하루1소재`;
    const url = '/' + TAB_PARAM[tab];
    if (window.location.pathname !== url) window.history.pushState({}, '', url);
  };

  const goHome = () => {
    setNotFound(false);
    setIsPrivacy(false);
    setIsHome(true);
    setMenuOpen(false);
    document.title = '하루1소재';
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const goPrivacy = () => {
    setNotFound(false);
    setIsHome(false);
    setIsPrivacy(true);
    document.title = '개인정보처리방침 | 하루1소재';
    if (window.location.pathname !== '/privacy') window.history.pushState({}, '', '/privacy');
    window.scrollTo(0, 0);
  };

  const handleChange = (key: keyof InputValues, value: number | string | boolean | MobGroup[]) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value };
      const newPresets = [...presetsRef.current];
      newPresets[activePresetRef.current] = next;
      presetsRef.current = newPresets;
      savePresets(newPresets);
      return next;
    });
  };

  const handleApply = (values: InputValues) => {
    setInputs(values);
    const newPresets = [...presetsRef.current];
    newPresets[activePresetRef.current] = values;
    presetsRef.current = newPresets;
    savePresets(newPresets);
  };

  const handlePresetChange = (idx: number) => {
    if (idx === activePresetRef.current) return;
    const newPresets = [...presetsRef.current];
    presetsRef.current = newPresets;
    savePresets(newPresets);
    activePresetRef.current = idx;
    setActivePreset(idx);
    setInputs(newPresets[idx]);
    try { localStorage.setItem(ACTIVE_PRESET_KEY, String(idx)); } catch {}
  };

  const handleNameChange = (idx: number, name: string) => {
    const newNames = [...presetNames];
    newNames[idx] = name;
    setPresetNames(newNames);
    saveNames(newNames);
  };

  const getInitialInputs = (level: number): InputValues => {
    const charLevel = Math.min(Math.max(level, 260), 300);
    const { region, ground } = getDefaultHunting(charLevel);
    const epicZone = charLevel >= 280 ? '악몽선경' : charLevel >= 270 ? '앵글러컴퍼니' : '하이마운틴';
    return {
      ...DEFAULT_INPUTS,
      charLevel,
      huntingRegion: region,
      huntingGround: ground.name,
      huntingMobs: ground.mobs,
      monsterLevel: ground.mobs[0].level,
      mobCount: ground.mobs.reduce((s, m) => s + m.count, 0),
      boosterMonsterLevel: ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level,
      epicDungeonZone: epicZone,
      monsterParkZone: getMonsterParkZone(charLevel),
    };
  };

  const handleCharacterConfirm = (info: CharacterInfo, inputs: InputValues) => {
    const idx = searchModalTarget;
    // 새 슬롯이면 이때 추가
    if (idx >= numSlots) {
      const newSlots = idx + 1;
      setNumSlots(newSlots);
      try { localStorage.setItem(NUM_SLOTS_KEY, String(newSlots)); } catch {}
    }
    handleNameChange(idx, info.name.slice(0, 12));
    const newPresets = [...presetsRef.current];
    newPresets[idx] = { ...inputs, charLevel: Math.min(Math.max(info.level, 260), 300) };
    presetsRef.current = newPresets;
    savePresets(newPresets);
    if (idx === activePresetRef.current) setInputs(newPresets[idx]);

    // charMeta 저장
    const mpBonus = info.monsterParkBonus ?? 0;
    const epBonus = info.epicDungeonBonus ?? 0;
    const trBonus = info.treasureBonus ?? 0;
    const meta: CharMeta = {
      ocid: info.ocid ?? null,
      image: info.image ?? null,
      imageUpdatedAt: Date.now(),
      guild: info.guild ?? null,
      class: info.class ?? null,
      world: info.world ?? null,
      dateCreate: null,
      unionLevel: null,
      monsterParkBonus: mpBonus || null,
      epicDungeonBonus: epBonus || null,
      treasureBonus: trBonus || null,
      monsterParkBonuses: mpBonus > 0 ? [{ name: '보약', pct: mpBonus, icon: null }] : null,
      epicDungeonBonuses: epBonus > 0 ? [{ name: '보약', pct: epBonus, icon: null }] : null,
      treasureBonuses: trBonus > 0 ? [{ name: '보약', pct: trBonus, icon: null }] : null,
      skillUpdatedAt: mpBonus > 0 || epBonus > 0 || trBonus > 0 ? Date.now() : null,
      manualExpRate: !info.ocid && info.expRate != null ? info.expRate : null,
    };
    setCharMetas(prev => {
      const next = [...prev];
      next[idx] = meta;
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // 수동 입력 경험치가 있으면 즉시 UI 반영 (영구 저장은 meta.manualExpRate / maple-char 캐시가 담당)
    if (info.expRate != null && idx === activePresetRef.current) {
      setTodayExpRate(info.expRate);
    }

    setShowSearchModal(false);
    handlePresetChange(idx);
  };

  const handleAddCharacter = () => {
    if (numSlots >= NUM_PRESETS) return;
    setSearchModalTarget(numSlots); // 아직 슬롯 추가 안 함
    setShowSearchModal(true);
  };

  const handleCharLevelUpdate = (idx: number, level: number) => {
    const clamped = Math.min(Math.max(level, 260), 300);
    const newPresets = [...presetsRef.current];
    newPresets[idx] = { ...newPresets[idx], charLevel: clamped };
    presetsRef.current = newPresets;
    savePresets(newPresets);
    if (idx === activePresetRef.current) setInputs(prev => ({ ...prev, charLevel: clamped }));
  };

  const handleMetaUpdate = (idx: number, patch: Partial<CharMeta>) => {
    if (idx === activePresetRef.current && patch.manualExpRate !== undefined) {
      setTodayExpRate(patch.manualExpRate ?? null);
    }
    setCharMetas(prev => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx]!, ...patch };
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // 캐릭터 데이터 갱신(앱 레벨) — 진입/F5/탭전환/슬롯전환 시 호출. 1분 쿨다운(성공·실패 공통).
  // 매 렌더마다 최신 클로저로 재할당해 stale 클로저 방지.
  refreshCharRef.current = async (presetIdx: number) => {
    const meta = charMetasRef.current[presetIdx];
    const ocid = meta?.ocid;
    if (!ocid) return;

    let lastAttempt = charRefreshedAtMap.current[ocid] ?? null;
    if (lastAttempt == null) {
      try {
        const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid));
        if (raw) lastAttempt = JSON.parse(raw).savedAt ?? null;
      } catch {}
    }
    if (lastAttempt != null && Date.now() - lastAttempt < REFRESH_COOLDOWN) return;

    charRefreshedAtMap.current[ocid] = Date.now(); // 시도 시각(실패해도 쿨다운 유지)
    setCharLoading(true);
    try {
      const rankParams = new URLSearchParams({ ocid });
      if (meta.world) rankParams.set('world', meta.world);
      if (meta.class) rankParams.set('class', meta.class);

      const [histData, rankData, skillData, unionData] = await Promise.all([
        fetch(`/api/character/history?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character/ranking?${rankParams}`).then(r => r.json()),
        fetch(`/api/character/skill?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character/union?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
      ]);

      // history 응답은 { history: HistoryPoint[], basic: {...} } — basic은 오늘 호출에서 추출(별도 basic 호출 제거)
      let histArr: HistoryPoint[] | null = Array.isArray(histData?.history) ? histData.history : null;
      const basic = histData?.basic ?? null;

      // 오늘 호출은 no-store로 매번 신선하게 받되, 특정 날짜(오늘 등) 호출이 실패해 빠지면 캐시의 값을 유지한다.
      // 부분 실패: 새 응답에 없는 날짜만 캐시로 보충 / 전체 실패(점검 등): 캐시 전체 유지 → 빈 그래프 방지.
      let prevCache: { savedAt?: number; history?: HistoryPoint[]; ranking?: Ranking | null } = {};
      try { const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid)); if (raw) prevCache = JSON.parse(raw); } catch {}
      if (histArr && histArr.length > 0) {
        const newDates = new Set(histArr.map(p => p.date));
        const oldest = histArr[0].date; // 라우트가 오름차순 정렬해 반환
        for (const p of (prevCache.history ?? [])) {
          if (!newDates.has(p.date) && p.date >= oldest) histArr.push(p);
        }
        histArr.sort((a, b) => a.date.localeCompare(b.date));
      } else if (Array.isArray(histData?.history)) {
        histArr = prevCache.history ?? []; // 응답은 왔지만 전 날짜 실패 → 캐시 유지
      }

      const histOk  = histArr !== null && histArr.length > 0;
      const rankOk  = rankData && typeof rankData === 'object' && rankData.error === undefined;
      const imageOk = basic != null;
      const skillOk = skillData && skillData.monsterParkBonus !== undefined;
      const unionOk = unionData && typeof unionData.unionLevel === 'number';

      // await 도중 슬롯이 바뀌었을 수 있으므로, 화면 상태에 반영하기 직전에
      // 현재 활성 슬롯(ref는 항상 최신)과 다시 비교한다.
      // (늦게 도착한 A 슬롯 응답이 B 슬롯 화면에 표시되는 레이스 컨디션 방지)
      const stillActive = presetIdx === activePresetRef.current;
      if (histOk && stillActive && histArr) {
        setCharHistory(histArr);
        const todayPoint = histArr.find(pt => pt.date === kstToday()) ?? null;
        setTodayExpRate(todayPoint?.expRate ?? null);
      }
      if (rankOk && stillActive) setCharRanking(rankData);

      if (imageOk || skillOk || unionOk) {
        const metaUpdate: Record<string, unknown> = {};
        if (unionOk) metaUpdate.unionLevel = unionData.unionLevel;
        if (imageOk) {
          metaUpdate.imageUpdatedAt = Date.now();
          metaUpdate.image = basic.image;
          if (basic.class !== undefined) metaUpdate.class = basic.class;
          if (basic.world !== undefined) metaUpdate.world = basic.world;
          if (basic.guild !== undefined) metaUpdate.guild = basic.guild;
          if (basic.dateCreate !== undefined) metaUpdate.dateCreate = basic.dateCreate;
        }
        if (skillOk) {
          metaUpdate.skillUpdatedAt = Date.now();
          metaUpdate.monsterParkBonus = skillData.monsterParkBonus;
          metaUpdate.epicDungeonBonus = skillData.epicDungeonBonus;
          metaUpdate.monsterParkBonuses = skillData.monsterParkBonuses ?? [];
          metaUpdate.epicDungeonBonuses = skillData.epicDungeonBonuses ?? [];
          metaUpdate.treasureBonus = skillData.treasureBonus;
          metaUpdate.treasureBonuses = skillData.treasureBonuses ?? [];
        }
        handleMetaUpdate(presetIdx, metaUpdate as Partial<CharMeta>);
      }
      if (imageOk && basic.level != null) {
        handleCharLevelUpdate(presetIdx, basic.level);
      }

      if (histOk) {
        charRefreshedAtMap.current[ocid] = Date.now();
      }

      if (histOk || rankOk) {
        const cache = {
          savedAt: histOk ? Date.now() : (prevCache.savedAt ?? Date.now()),
          history: histOk ? histArr : (prevCache.history ?? []),
          ranking: rankOk ? rankData : (prevCache.ranking ?? null),
        };
        try { localStorage.setItem(CHAR_CACHE_KEY(ocid), JSON.stringify(cache)); } catch {}
      }
    } catch {
      // 실패: 조용히 마지막 정상 데이터 유지. 쿨다운은 시도 시각으로 이미 설정됨.
    } finally {
      setCharLoading(false);
    }
  };

  // 활성 캐릭터 변경 시 캐시에서 표시 데이터 로드
  useEffect(() => {
    if (!mounted) return;
    const ocid = charMetas[activePreset]?.ocid;
    if (!ocid) {
      setCharHistory([]); setCharRanking(null);
      return;
    }
    try {
      const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid));
      if (raw) {
        const cache = JSON.parse(raw);
        setCharHistory(cache.history ?? []);
        setCharRanking(cache.ranking ?? null);
      } else {
        setCharHistory([]); setCharRanking(null);
      }
    } catch {}
  }, [mounted, activePreset, charMetas[activePreset]?.ocid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 갱신 트리거 — 캐릭터 쓰는 탭(정보센터/홈 제외) 진입·F5·탭전환·슬롯전환·캐릭터 추가 시
  useEffect(() => {
    if (!mounted || isHome || isPrivacy || notFound) return;
    if (activeTab === TABS[4]) return; // 정보 센터 제외
    refreshCharRef.current(activePreset);
  }, [mounted, activeTab, activePreset, isHome, isPrivacy, notFound, charMetas[activePreset]?.ocid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteSlot = (idx: number) => {
    if (numSlots <= 1) return;

    // 삭제되는 슬롯의 ocid 캐시 제거 (CharacterCard가 쓰는 실제 키)
    const deletedOcid = charMetas[idx]?.ocid;
    if (deletedOcid) {
      try { localStorage.removeItem(`maple-char-${deletedOcid}`); } catch {}
    }

    const newNames = [...presetNames];
    const newPresets = [...presetsRef.current];
    newNames.splice(idx, 1);
    newNames.push(DEFAULT_NAMES[newNames.length] ?? String(newNames.length + 1));
    newPresets.splice(idx, 1);
    newPresets.push({ ...DEFAULT_INPUTS });
    const newSlots = numSlots - 1;
    let newActive = activePreset;
    if (activePreset === idx) newActive = Math.max(0, idx - 1);
    else if (activePreset > idx) newActive = activePreset - 1;
    setNumSlots(newSlots);
    setPresetNames(newNames);
    saveNames(newNames);
    presetsRef.current = newPresets;
    savePresets(newPresets);
    activePresetRef.current = newActive;
    setActivePreset(newActive);
    setInputs(newPresets[newActive]);

    // charMeta 업데이트
    setCharMetas(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      next.push(null);
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try { localStorage.setItem(ACTIVE_PRESET_KEY, String(newActive)); } catch {}
    try { localStorage.setItem(NUM_SLOTS_KEY, String(newSlots)); } catch {}
  };

  const handleReorder = (from: number, to: number) => {
    if (from === to) return;
    const newNames = [...presetNames];
    const newPresets = [...presetsRef.current];
    const [n] = newNames.splice(from, 1);
    newNames.splice(to, 0, n);
    const [p] = newPresets.splice(from, 1);
    newPresets.splice(to, 0, p);
    setPresetNames(newNames);
    saveNames(newNames);
    presetsRef.current = newPresets;
    savePresets(newPresets);
    setCharMetas(prev => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    let newActive = activePreset;
    if (activePreset === from) newActive = to;
    else if (from < to && activePreset > from && activePreset <= to) newActive = activePreset - 1;
    else if (from > to && activePreset >= to && activePreset < from) newActive = activePreset + 1;
    activePresetRef.current = newActive;
    setActivePreset(newActive);
    setInputs(newPresets[newActive]);
    try { localStorage.setItem(ACTIVE_PRESET_KEY, String(newActive)); } catch {}
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('maple-dark-mode', String(next)); } catch {}
  };

  const rankedItems = useMemo(
    () => calcAllItems(inputs, charMetas[activePreset]?.monsterParkBonus ?? 0),
    [inputs, charMetas, activePreset]
  );

  if (!mounted) return <div className="min-h-dvh bg-gray-50 dark:bg-black" />;

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-black">
      {showSearchModal && (
        <CharacterSearchModal
          onConfirm={handleCharacterConfirm}
          onClose={() => setShowSearchModal(false)}
          getInitialInputs={getInitialInputs}
          existingOcids={charMetas.filter(m => m?.ocid).map(m => m!.ocid!)}
          loadSources={Array.from({ length: numSlots }, (_, i) => ({ name: presetNames[i], inputs: presetsRef.current[i] }))}
        />
      )}
      {showInfoModal && (
        <CharacterInfoModal
          charName={presetNames[activePreset]}
          initialInputs={inputs}
          onApply={handleApply}
          onClose={() => setShowInfoModal(false)}
          loadSources={Array.from({ length: numSlots }, (_, i) => ({ name: presetNames[i], inputs: presetsRef.current[i] })).filter((_, i) => i !== activePreset)}
        />
      )}
      {showDetailModal && charMetas[activePreset]?.ocid && (
        <CharacterDetailModal
          name={presetNames[activePreset]}
          history={charHistory}
          ranking={charRanking}
          onClose={() => setShowDetailModal(false)}
        />
      )}
      <header className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-600 shrink-0 z-50 shadow-sm">
        <div className="w-full px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={goHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/icon.png" alt="icon" className="w-8 h-8 translate-y-[1px]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">하루<span className="text-orange-500">1소재</span></h1>
          </button>
          <div className="flex items-center gap-3">
            {/* lg 이상: 탭 메뉴가 헤더에 바로 보임 */}
            <nav className="hidden lg:flex items-center gap-1">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={
                    'px-3 py-2 flex items-center gap-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ' +
                    (activeTab === tab && !notFound && !isPrivacy && !isHome ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700')
                  }
                >
                  <TabIcon tab={tab} className="shrink-0" />
                  {tab}
                </button>
              ))}
            </nav>
            {/* lg 미만: 햄버거 버튼으로만 메뉴 열림 */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="메뉴"
              className="order-2 lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              )}
            </button>
            <button
              onClick={toggleDark}
              className="order-1 p-1.5 rounded-lg transition-colors cursor-pointer text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* lg 미만에서 메뉴 열릴 때 항상 배경 딤 */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setMenuOpen(false)} />
      )}
      {/* 우측 메뉴 패널 (lg 미만 전용) */}
      <aside
        className={
          'lg:hidden fixed top-0 right-0 bottom-0 z-40 w-[200px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-600 shadow-lg pt-[64px] flex flex-col transition-transform duration-200 ' +
          (menuOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <nav className="flex flex-col p-2 gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={
                'px-4 py-3 flex items-center gap-2.5 text-left text-sm font-medium rounded-lg transition-colors cursor-pointer ' +
                (activeTab === tab && !notFound && !isPrivacy && !isHome ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700')
              }
            >
              <TabIcon tab={tab} className="shrink-0" />
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <div id="app-scroll" className="flex-1 flex flex-col bg-gray-50 dark:bg-black">
      <div className="flex-1 flex flex-col">
      <div className="flex-1 pb-10">
      {notFound ? (
        <div className="flex flex-col items-center justify-center gap-2 text-center px-4 py-24">
          <img src="/404.png" alt="404" />
          <p className="text-4xl font-bold text-gray-800 dark:text-zinc-100">404</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">페이지를 찾을 수 없습니다.</p>
          <button
            onClick={goHome}
            className="mt-1 px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors cursor-pointer"
          >메인으로</button>
        </div>
      ) : isHome ? (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-6 text-center">
        <div className="relative w-full max-w-[905px] aspect-[905/300] rounded-2xl overflow-hidden shadow-sm">
          <img
            src={`/main/${encodeURIComponent('main banner')}.jpg`}
            alt="하루1소재"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4">
            <h2
              className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
            >하루<span className="text-orange-500">1소재</span></h2>
            <p
              className="text-xs lg:text-base font-medium text-white/90"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
            >메이플스토리 경험치 효율 시뮬레이터</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full max-w-[905px]">
          {TABS.filter(t => t !== '정보 센터').map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className="h-16 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:border-orange-400 hover:shadow transition-all cursor-pointer text-sm font-semibold text-gray-700 dark:text-zinc-200 flex flex-row items-center justify-center gap-2">
              <TabIcon tab={t} className="shrink-0" />
              {t}
            </button>
          ))}
        </div>
        <HomeCardSection />
      </div>
      ) : isPrivacy ? (
      <div className="mx-auto px-4 py-6">
        <div className="w-full max-w-[905px] mx-auto">
          <PrivacyTab />
        </div>
      </div>
      ) : (
      <div className="mx-auto px-4 py-6">
        <div className="w-full max-w-[905px] mx-auto">
          {activeTab !== '정보 센터' && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-zinc-500">캐릭터</span>
            {Array.from({ length: numSlots }, (_, i) => (
              isEditMode ? (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={e => {
                    e.preventDefault();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDropGap(e.clientX > rect.left + rect.width / 2 ? i + 1 : i);
                  }}
                  onDrop={() => {
                    if (dragIndex !== null && dropGap !== null) {
                      const to = dropGap > dragIndex ? dropGap - 1 : dropGap;
                      handleReorder(dragIndex, to);
                    }
                    setDragIndex(null); setDropGap(null);
                  }}
                  onDragEnd={() => { setDragIndex(null); setDropGap(null); }}
                  className={'relative ' + (dragIndex === i ? 'opacity-40' : '')}
                >
                  {dragIndex !== null && dropGap === i && (
                    <span className="absolute -left-[5px] top-0 bottom-0 w-[3px] bg-orange-500 rounded-full pointer-events-none" />
                  )}
                  {dragIndex !== null && dropGap === numSlots && i === numSlots - 1 && (
                    <span className="absolute -right-[5px] top-0 bottom-0 w-[3px] bg-orange-500 rounded-full pointer-events-none" />
                  )}
                  <div
                    className={
                      'flex items-center h-7 rounded-lg border text-xs transition-colors select-none ' +
                      (charMetas[i] && !charMetas[i].ocid
                        ? 'border-dashed border-gray-300 dark:border-zinc-500 bg-gray-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800')
                    }
                  >
                    <span className="px-1.5 cursor-grab text-gray-400 dark:text-zinc-500">
                      <svg width="8" height="13" viewBox="0 0 8 13" fill="currentColor">
                        <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                        <circle cx="2" cy="6.5" r="1.2"/><circle cx="6" cy="6.5" r="1.2"/>
                        <circle cx="2" cy="11" r="1.2"/><circle cx="6" cy="11" r="1.2"/>
                      </svg>
                    </span>
                    <span className="px-1.5 text-gray-700 dark:text-zinc-300 font-semibold">{presetNames[i]}</span>
                    <button
                      onClick={() => handleDeleteSlot(i)}
                      className={`px-1.5 transition-colors cursor-pointer ${numSlots === 1 ? 'text-gray-200 dark:text-zinc-700 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  key={i}
                  onClick={() => handlePresetChange(i)}
                  className={
                    'h-7 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ' +
                    (activePreset === i
                      ? 'bg-orange-500 text-white border-orange-500'
                      : (charMetas[i] && !charMetas[i].ocid
                          ? 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border-dashed border-gray-300 dark:border-zinc-500'
                          : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-600'))
                  }
                >
                  {presetNames[i]}
                </button>
              )
            ))}
            {!isEditMode && numSlots < NUM_PRESETS && (
              <button
                onClick={handleAddCharacter}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-dashed border-gray-300 dark:border-zinc-600"
                title="캐릭터 추가"
              >
                +
              </button>
            )}
            {numSlots > 0 && (
              <button
                onClick={() => setIsEditMode(v => !v)}
                className="h-7 px-2 text-xs underline transition-colors cursor-pointer text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                {isEditMode ? '완료' : '편집'}
              </button>
            )}
          </div>
          )}
          {activeTab === TABS[0] ? (
            numSlots === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center py-24">
                <img src="/table.png" alt="" />
                <p className="text-lg font-semibold text-gray-700 dark:text-zinc-200">캐릭터를 추가해주세요</p>
                <button onClick={handleAddCharacter} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors cursor-pointer">캐릭터 추가</button>
              </div>
            ) : (
            <div className="flex flex-col lg:flex-row gap-4">
                <main className="w-full lg:w-[560px] lg:shrink-0">
                  <div className="mb-4">
                    <CharacterCard
                      name={presetNames[activePreset]}
                      level={presetsRef.current[activePreset]?.charLevel ?? inputs.charLevel}
                      meta={charMetas[activePreset]}
                      isEmpty={numSlots === 0}
                      history={charHistory}
                      ranking={charRanking}
                      loading={charLoading}
                      onOpenDetail={() => setShowDetailModal(true)}
                    />
                  </div>
                  {/* 모바일 전용: 입력정보·보약정보를 캐릭터카드 바로 아래에 (데스크톱은 우측 aside에서 표시) */}
                  <div className="lg:hidden flex flex-col gap-4 mb-4">
                    <InputSummaryCard inputs={inputs} meta={charMetas[activePreset]} onEditInfo={() => setShowInfoModal(true)} />
                  </div>
                  <EfficiencyTab inputs={inputs} onChange={handleChange} items={rankedItems} monsterParkBonus={charMetas[activePreset]?.monsterParkBonus ?? 0} />
                </main>
                <aside className="flex-1 min-w-0 flex flex-col gap-4">
                  <div className="hidden lg:flex flex-col gap-4">
                    <InputSummaryCard inputs={inputs} meta={charMetas[activePreset]} onEditInfo={() => setShowInfoModal(true)} />
                  </div>
                  <RankingPanel items={rankedItems} />
                </aside>
            </div>
            )
          ) : (
            <div>
                {activeTab === TABS[1] && (
                  <ExpContentsTab
                    initialSelected={initialContentKey}
                    charLevel={inputs.charLevel}
                    monsterLevel={inputs.monsterLevel}
                    monsterParkBonus={charMetas[activePreset]?.monsterParkBonus ?? 0}
                    epicDungeonBonus={charMetas[activePreset]?.epicDungeonBonus ?? 0}
                    treasureBonus={charMetas[activePreset]?.treasureBonus ?? 0}
                    todayExpRate={todayExpRate}
                    slotKey={activePreset}
                    hasCharacter={numSlots > 0}
                  />
                )}
                {activeTab === TABS[2] && (
                  <ExpInfoTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} huntingMobs={inputs.huntingMobs} hasCharacter={numSlots > 0} />
                )}
                {activeTab === TABS[3] && (
                  <HuntingGroundTab charLevel={inputs.charLevel} huntingRegion={inputs.huntingRegion} huntingGround={inputs.huntingGround} hasCharacter={numSlots > 0} onAddCharacter={handleAddCharacter} />
                )}
                {activeTab === TABS[4] && (
                  <InfoCenterTab />
                )}
            </div>
          )}
        </div>
      </div>
      )}
      </div>
      <footer className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-600 shrink-0">
        <div className="w-full max-w-[905px] mx-auto px-4 py-6 flex flex-col items-center gap-2.5 text-center">
          <div className="flex items-center gap-2 text-xs">
            <a href="mailto:haru1sojae@gmail.com" className="text-gray-600 dark:text-zinc-300 hover:text-orange-500 transition-colors">문의하기</a>
            <span className="text-gray-300 dark:text-zinc-600">|</span>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); goPrivacy(); }} className="text-gray-600 dark:text-zinc-300 hover:text-orange-500 transition-colors">개인정보처리방침</a>
          </div>
          <div className="flex flex-col leading-relaxed">
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">Data based on NEXON OPEN API</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">This site is not an official site of NEXON and does not provide any warranty.</p>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500">© 2026 하루1소재 by 레틴. All rights reserved.</p>
        </div>
      </footer>
      </div>
      </div>
    </div>
  );
}
