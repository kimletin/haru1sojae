'use client';

import { useState, useMemo, useEffect } from 'react';
import type { InputValues } from '@/types';
import { calcAllItems } from '@/lib/calculator';
import InputPanel from '@/components/InputPanel';
import RankingPanel from '@/components/RankingPanel';
import EfficiencyTab from '@/components/EfficiencyTab';
import ExpInfoTab from '@/components/ExpInfoTab';
import BMExpTab from '@/components/BMExpTab';
import EpicDungeonTab from '@/components/EpicDungeonTab';
import { SunIcon, MoonIcon } from '@/components/Icons';

const STORAGE_KEY = 'maple-exp-bm-inputs';

const DEFAULT_INPUTS: InputValues = {
  mesoMarketRate: 2420,
  charLevel: 296,
  monsterLevel: 297,
  dailySessions: 10,
  mobCount: 40,
  booster30min: 3,
  eternal30min: 0,
  booster1day: 6,
  eternal1day: 0,
  price50: 500_000,
  price70: 6_000_000,
  price2x: 60_000_000,
  price3x: 65_000_000,
  price4x: 85_000_000,
  priceSmallBooster: 1_300_000,
  priceLargeBooster: 5_630_000,
  priceAzmos: 5_000_000,
  priceHunterTitle: 1_640_000_000,
  priceBloodRingMeso: 320_000_000,
  priceBoostringMeso: 870_000_000,
  priceJungpenMeso: 2_000_000_000,
  priceEcho: 40_000_000,
  epicDungeonZone: '악몽선경',
  sunday: '없음',
  boosterRate: 0.5,
};

function loadInputs(): InputValues {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_INPUTS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_INPUTS;
}

const TABS = [
  '경험치 효율표',
  '경험치 정보',
  'BM 경험치',
  '에픽 던전',
] as const;
type Tab = typeof TABS[number];

const TAB_PARAM: Record<Tab, string> = {
  '경험치 효율표': 'eff',
  '경험치 정보':   'exp',
  'BM 경험치':    'bm',
  '에픽 던전':     'epic',
};
const PARAM_TO_TAB: Record<string, Tab> = Object.fromEntries(
  Object.entries(TAB_PARAM).map(([k, v]) => [v, k as Tab])
);

export default function Home() {
  const [inputs, setInputs] = useState<InputValues>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // 탭 복원
    const params = new URLSearchParams(window.location.search);
    const tab = PARAM_TO_TAB[params.get('tab') ?? ''];
    if (tab) setActiveTab(tab);
    // 입력값 복원
    setInputs(loadInputs());
    // 다크모드 복원
    const saved = localStorage.getItem('maple-dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs)); } catch {}
  }, [inputs]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', TAB_PARAM[tab]);
    window.history.replaceState({}, '', url.toString());
  };

  const handleChange = (key: keyof InputValues, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('maple-dark-mode', String(next)); } catch {}
  };

  const rankedItems = useMemo(() => calcAllItems(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">경험치 BM 효율표</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Made by 레틴</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-1">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                    (activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100')
                  }
                >
                  {tab}
                </button>
              ))}
            </nav>
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={darkMode ? '라이트 모드' : '다크 모드'}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === TABS[0] ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            <div className="flex flex-col xl:flex-row gap-6">
              <main className="min-w-0" style={{flex: "3 1 0"}}>
                <EfficiencyTab inputs={inputs} onChange={handleChange} items={rankedItems} />
              </main>
              <aside className="xl:w-80 shrink-0 space-y-4">
                <InputPanel inputs={inputs} onChange={handleChange} />
                <RankingPanel items={rankedItems} />
              </aside>
            </div>
          </div>
        ) : (
          <main className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
            {activeTab === TABS[1] && (
              <ExpInfoTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} />
            )}
            {activeTab === TABS[2] && (
              <BMExpTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} />
            )}
            {activeTab === TABS[3] && (
              <EpicDungeonTab charLevel={inputs.charLevel} />
            )}
          </main>
        )}
      </div>
    </div>
  );
}
