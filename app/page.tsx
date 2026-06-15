'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { InputValues, MobGroup } from '@/types';
import { calcAllItems } from '@/lib/calculator';
import InputPanel from '@/components/InputPanel';
import RankingPanel from '@/components/RankingPanel';
import EfficiencyTab from '@/components/EfficiencyTab';
import ExpInfoTab from '@/components/ExpInfoTab';
import BMExpTab from '@/components/BMExpTab';
import EpicDungeonTab from '@/components/EpicDungeonTab';
import HuntingGroundTab from '@/components/HuntingGroundTab';
import InfoCenterTab from '@/components/InfoCenterTab';
import { SunIcon, MoonIcon } from '@/components/Icons';

const STORAGE_KEY = 'maple-exp-bm-inputs';
const PRESETS_KEY = 'maple-exp-bm-presets';
const PRESET_NAMES_KEY = 'maple-exp-bm-preset-names';
const ACTIVE_PRESET_KEY = 'maple-exp-bm-active-preset';
const NUM_PRESETS = 5;

const DEFAULT_INPUTS: InputValues = {
  waterBottleRate: 0,
  mesoMarketRate: 2280,
  charLevel: 297,
  monsterLevel: 298,
  dailySessions: 10,
  mobCount: 40,
  huntingRegion: '기어드락',
  huntingGround: '로봇 창고 5',
  huntingMobs: [{ level: 298, count: 40 }],
  boosterMonsterLevel: 298,
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
  epicDungeonZone: '악몽선경',
  sunday: '없음',
  boosterRate: 0.5,
};

const DEFAULT_NAMES = ['1', '2', '3', '4', '5'];

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
        return { presets: parsed.map(p => ({ ...DEFAULT_INPUTS, ...p })), active, names };
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
  '경험치 정보',
  'BM 경험치',
  '에픽 던전',
  '사냥터',
  '정보 센터',
] as const;
type Tab = typeof TABS[number];

const TAB_PARAM: Record<Tab, string> = {
  '경험치 효율표': 'eff',
  '경험치 정보':   'exp',
  'BM 경험치':    'bm',
  '에픽 던전':     'epic',
  '사냥터':        'hunt',
  '정보 센터':     'info',
};
const PARAM_TO_TAB: Record<string, Tab> = Object.fromEntries(
  Object.entries(TAB_PARAM).map(([k, v]) => [v, k as Tab])
);

export default function Home() {
  const [inputs, setInputs] = useState<InputValues>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [darkMode, setDarkMode] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [presetNames, setPresetNames] = useState<string[]>([...DEFAULT_NAMES]);
  const [editingPreset, setEditingPreset] = useState<number | null>(null);
  const presetsRef = useRef<InputValues[]>(makeDefaultPresets());
  const activePresetRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = PARAM_TO_TAB[params.get('tab') ?? ''];
    if (tab) setActiveTab(tab);

    const { presets, active, names } = loadPresets();
    presetsRef.current = presets;
    activePresetRef.current = active;
    setActivePreset(active);
    setPresetNames(names);
    setInputs(presets[active]);

    const saved = localStorage.getItem('maple-dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === TABS[0]) {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', TAB_PARAM[tab]);
    }
    window.history.replaceState({}, '', url.toString());
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

  const handleNameBlur = (idx: number) => {
    if (!presetNames[idx].trim()) {
      handleNameChange(idx, DEFAULT_NAMES[idx]);
    }
    setEditingPreset(null);
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('maple-dark-mode', String(next)); } catch {}
  };

  const rankedItems = useMemo(() => calcAllItems(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-600 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => handleTabChange(TABS[0])}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/icon.png" alt="icon" className="w-8 h-8" />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Mapleff</h1>
              <p className="text-xs text-gray-400 dark:text-zinc-500">메이플스토리 경험치 효율 계산기</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <nav className="flex flex-wrap gap-1">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ' +
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
        <div className="w-fit mx-auto">
          {activeTab !== TABS[5] && <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs text-gray-400 dark:text-zinc-500">캐릭터</span>
            {Array.from({ length: NUM_PRESETS }, (_, i) => (
              editingPreset === i ? (
                <input
                  key={i}
                  autoFocus
                  maxLength={12}
                  value={presetNames[i]}
                  onChange={e => handleNameChange(i, e.target.value)}
                  onBlur={() => handleNameBlur(i)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') handleNameBlur(i); }}
                  className="w-16 h-7 text-xs text-center border border-orange-400 rounded-lg px-1 outline-none bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100"
                />
              ) : (
                <button
                  key={i}
                  onClick={() => handlePresetChange(i)}
                  onDoubleClick={() => setEditingPreset(i)}
                  className={
                    'h-7 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer max-w-[64px] truncate ' +
                    (activePreset === i
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700')
                  }
                >
                  {presetNames[i]}
                </button>
              )
            ))}
          </div>}
          {activeTab === TABS[0] ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-4">
              <div className="flex flex-row gap-6">
                <main className="min-w-[500px]" style={{flex: "0 0 auto"}}>
                  <EfficiencyTab inputs={inputs} onChange={handleChange} items={rankedItems} />
                </main>
                <aside className="w-80 shrink-0 flex flex-col gap-4">
                  <InputPanel inputs={inputs} onChange={handleChange} />
                  <RankingPanel items={rankedItems} />
                </aside>
              </div>
            </div>
          ) : (
            <main className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-4">
              {activeTab === TABS[1] && (
                <ExpInfoTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} huntingMobs={inputs.huntingMobs} />
              )}
              {activeTab === TABS[2] && (
                <BMExpTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} />
              )}
              {activeTab === TABS[3] && (
                <EpicDungeonTab charLevel={inputs.charLevel} />
              )}
              {activeTab === TABS[4] && (
                <HuntingGroundTab charLevel={inputs.charLevel} huntingRegion={inputs.huntingRegion} huntingGround={inputs.huntingGround} />
              )}
              {activeTab === TABS[5] && (
                <InfoCenterTab />
              )}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}
