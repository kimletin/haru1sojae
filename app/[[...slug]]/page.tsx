'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { InputValues, MobGroup } from '@/types';
import { calcAllItems } from '@/lib/calculator';
import InputPanel from '@/components/InputPanel';
import RankingPanel from '@/components/RankingPanel';
import EfficiencyTab from '@/components/EfficiencyTab';
import ExpInfoTab from '@/components/ExpInfoTab';
import ExpContentsTab from '@/components/ExpContentsTab';
import HuntingGroundTab from '@/components/HuntingGroundTab';
import InfoCenterTab from '@/components/InfoCenterTab';
import CharacterSearchModal, { type CharacterInfo } from '@/components/CharacterSearchModal';
import CharacterCard from '@/components/CharacterCard';
import { SunIcon, MoonIcon } from '@/components/Icons';
import type { CharMeta } from '@/types';
import { getDefaultHunting } from '@/data/huntingGrounds';

// 세션 내 오늘 경험치 조회 완료된 ocid (새로고침 시 초기화)

const STORAGE_KEY = 'haru1sojae-inputs';
const PRESETS_KEY = 'haru1sojae-presets';
const PRESET_NAMES_KEY = 'haru1sojae-preset-names';
const ACTIVE_PRESET_KEY = 'haru1sojae-active-preset';
const NUM_SLOTS_KEY = 'haru1sojae-num-slots';
const CHAR_META_KEY = 'haru1sojae-char-meta';
const NUM_PRESETS = 6;
const DEFAULT_NUM_SLOTS = 0;

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
  priceEcho: 40_000_000,
  priceSolErda: 7_100_000,
  useSolErda: true,
  epicDungeonZone: '하이마운틴',
  sunday: '평일',
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
        return { presets: parsed.map(p => p ? { ...DEFAULT_INPUTS, ...p } : { ...DEFAULT_INPUTS }), active, names };
      }
    }
    const old = localStorage.getItem(STORAGE_KEY);
    if (old) {
      const presets = makeDefaultPresets();
      presets[0] = { ...DEFAULT_INPUTS, ...JSON.parse(old) };
      return { presets, active: 0, names };
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
  '경험치 효율표':  'eff',
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
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [numSlots, setNumSlots] = useState(DEFAULT_NUM_SLOTS);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalTarget, setSearchModalTarget] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [charMetas, setCharMetas] = useState<(CharMeta | null)[]>(makeDefaultMetas());
  const [todayExpRate, setTodayExpRate] = useState<number | null>(null);
  const [initialContentKey, setInitialContentKey] = useState<string | undefined>(undefined);
  const presetsRef = useRef<InputValues[]>(makeDefaultPresets());
  const activePresetRef = useRef(0);

  useEffect(() => {
    const slug = window.location.pathname.replace(/^\//, '');
    const parts = slug.split('/');
    const tabSlug = parts[0];
    const tab = PARAM_TO_TAB[tabSlug] ?? PARAM_TO_TAB[slug];
    const initialTab = tab ?? TABS[0];
    if (tab) setActiveTab(tab);
    if (tabSlug === 'cont' && parts[1]) setInitialContentKey(parts[1]);
    document.title = `${initialTab} | 하루1소재`;

    const savedSlots = parseInt(localStorage.getItem(NUM_SLOTS_KEY) ?? '');
    if (!isNaN(savedSlots)) setNumSlots(Math.min(Math.max(savedSlots, 1), NUM_PRESETS));

    const isNew = !localStorage.getItem(PRESETS_KEY) && !localStorage.getItem(STORAGE_KEY);
    if (isNew) {
      setIsFirstVisit(true);
      setSearchModalTarget(0);
      setShowSearchModal(true);
    }

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

  useEffect(() => {
    document.title = `${presetNames[activePreset]} | ${activeTab} | 하루1소재`;
  }, [activeTab, activePreset, presetNames]);

  useEffect(() => {
    if (!mounted) return;
    const rate = loadTodayExpRateFrom(charMetas[activePreset]);
    setTodayExpRate(rate);
  }, [activePreset]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    document.title = `${tab} | 하루1소재`;
    const path = tab === TABS[0] ? '/' : '/' + TAB_PARAM[tab];
    window.history.replaceState({}, '', path);
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

  const handleCharacterConfirm = (info: CharacterInfo) => {
    const idx = searchModalTarget;
    // 새 슬롯이면 이때 추가
    if (idx >= numSlots) {
      const newSlots = idx + 1;
      setNumSlots(newSlots);
      try { localStorage.setItem(NUM_SLOTS_KEY, String(newSlots)); } catch {}
    }
    handleNameChange(idx, info.name.slice(0, 12));
    const newPresets = [...presetsRef.current];
    const charLevel = Math.min(Math.max(info.level, 260), 300);
    const { region, ground } = getDefaultHunting(charLevel);
    const epicZone = charLevel >= 280 ? '악몽선경' : charLevel >= 270 ? '앵컴' : '하이마운틴';
    newPresets[idx] = {
      ...newPresets[idx],
      charLevel,
      huntingRegion: region,
      huntingGround: ground.name,
      huntingMobs: ground.mobs,
      monsterLevel: ground.mobs[0].level,
      mobCount: ground.mobs.reduce((s, m) => s + m.count, 0),
      boosterMonsterLevel: ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level,
      epicDungeonZone: epicZone,
    };
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

    // 수동 입력 경험치가 있으면 today 캐시에 저장
    if (info.expRate != null && (meta.ocid || info.name)) {
      const cacheKey = meta.ocid
        ? `maple-hist-today-${meta.ocid}`
        : `maple-hist-today-manual-${info.name}`;
      const todayData = { date: new Date().toISOString().slice(0, 10), expRate: info.expRate, level: info.level, exp: 0 };
      try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data: todayData })); } catch {}
      if (idx === activePresetRef.current) setTodayExpRate(info.expRate);
    }

    setShowSearchModal(false);
    setIsFirstVisit(false);
    handlePresetChange(idx);
  };

  const handleAddCharacter = () => {
    if (numSlots >= NUM_PRESETS) return;
    setSearchModalTarget(numSlots); // 아직 슬롯 추가 안 함
    setIsFirstVisit(false);
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

  const handleDeleteSlot = (idx: number) => {
    if (numSlots <= 1) return;

    // 삭제되는 슬롯의 ocid 캐시 제거
    const deletedOcid = charMetas[idx]?.ocid;
    if (deletedOcid) {
      try { localStorage.removeItem(`maple-hist-past-${deletedOcid}`); } catch {}
      try { localStorage.removeItem(`maple-hist-today-${deletedOcid}`); } catch {}
      try { localStorage.removeItem(`maple-ranking-${deletedOcid}`); } catch {}
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

  const currentOcid = charMetas[activePreset]?.ocid ?? null;

  if (!mounted) return <div className="min-h-screen bg-gray-50 dark:bg-black" />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {showSearchModal && (
        <CharacterSearchModal
          onConfirm={handleCharacterConfirm}
          onClose={isFirstVisit ? undefined : () => setShowSearchModal(false)}
          existingOcids={charMetas.filter(m => m?.ocid).map(m => m!.ocid!)}
          existingNames={presetNames}
        />
      )}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-600 sticky top-0 z-10 shadow-sm">
        <div className="w-[905px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => handleTabChange(TABS[0])}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/icon.png" alt="icon" className="w-8 h-8" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">하루1소재</h1>
              <p className="text-xs text-gray-400 dark:text-zinc-500">메이플스토리 경험치의 모든 것</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <nav className="flex flex-wrap gap-1">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={
                    'px-2.5 py-1 rounded-lg text-sm font-medium transition-colors cursor-pointer ' +
                    (activeTab === tab ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100')
                  }
                >
                  {tab}
                </button>
              ))}
            </nav>
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg transition-colors cursor-pointer text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={darkMode ? '라이트 모드' : '다크 모드'}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="w-[905px] mx-auto">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-zinc-500">캐릭터</span>
            {Array.from({ length: numSlots }, (_, i) => (
              isEditMode ? (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={e => { e.preventDefault(); setDragOverIndex(i); }}
                  onDrop={() => { handleReorder(dragIndex ?? i, i); setDragIndex(null); setDragOverIndex(null); }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  className={
                    'flex items-center h-7 rounded-lg border text-xs transition-colors select-none ' +
                    (dragOverIndex === i && dragIndex !== i
                      ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                      : (charMetas[i] && !charMetas[i].ocid
                          ? 'border-dashed border-gray-300 dark:border-zinc-500 bg-gray-50 dark:bg-zinc-800'
                          : 'border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800'))
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
          {activeTab === TABS[0] ? (
            <div className="flex flex-row gap-4">
                <main className="w-[560px] shrink-0">
                  <div className="mb-4">
                    <CharacterCard
                      name={presetNames[activePreset]}
                      level={presetsRef.current[activePreset]?.charLevel ?? inputs.charLevel}
                      meta={charMetas[activePreset]}
                      onMetaUpdate={(patch) => handleMetaUpdate(activePreset, patch)}
                      onTodayLoaded={(rate) => setTodayExpRate(rate ?? null)}
                      onCharLevelUpdate={(level) => handleCharLevelUpdate(activePreset, level)}
                      isEmpty={numSlots === 0}
                    />
                  </div>
                  <EfficiencyTab inputs={inputs} onChange={handleChange} items={rankedItems} monsterParkBonus={charMetas[activePreset]?.monsterParkBonus ?? 0} />
                </main>
                <aside className="flex-1 flex flex-col gap-4">
                  <InputPanel inputs={inputs} onApply={handleApply} />
                  <RankingPanel items={rankedItems} />
                </aside>
            </div>
          ) : (
            <div>
                {activeTab === TABS[1] && (
                  <ExpContentsTab
                    initialSelected={initialContentKey}
                    charLevel={inputs.charLevel}
                    monsterLevel={inputs.monsterLevel}
                    monsterParkBonus={charMetas[activePreset]?.monsterParkBonus ?? 0}
                    epicDungeonBonus={charMetas[activePreset]?.epicDungeonBonus ?? 0}
                    epicDungeonBonuses={charMetas[activePreset]?.epicDungeonBonuses?.map(b => ({ name: b.name, pct: b.pct })) ?? []}
                    treasureBonus={charMetas[activePreset]?.treasureBonus ?? 0}
                    treasureBonuses={charMetas[activePreset]?.treasureBonuses?.map(b => ({ name: b.name, pct: b.pct })) ?? []}
                    todayExpRate={todayExpRate}
                    slotKey={activePreset}
                  />
                )}
                {activeTab === TABS[2] && (
                  <ExpInfoTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} huntingMobs={inputs.huntingMobs} />
                )}
                {activeTab === TABS[3] && (
                  <HuntingGroundTab charLevel={inputs.charLevel} huntingRegion={inputs.huntingRegion} huntingGround={inputs.huntingGround} />
                )}
                {activeTab === TABS[4] && (
                  <InfoCenterTab />
                )}
            </div>
          )}
          {activeTab === TABS[4] && (
            <div className="flex justify-center mt-4">
              <a
                href="https://open.kakao.com/me/letin_k"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex"
                title="카카오톡 문의"
              >
                <div className="w-9 h-9 rounded-[9px] bg-gray-300 group-hover:bg-yellow-400 transition-colors flex items-center justify-center">
                  <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="12" cy="9" rx="12" ry="9" className="fill-gray-500 group-hover:fill-[#3A1D1D] transition-colors"/>
                    <polygon points="3,18 7,13 5,19.5" className="fill-gray-500 group-hover:fill-[#3A1D1D] transition-colors"/>
                  </svg>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
