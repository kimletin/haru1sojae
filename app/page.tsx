'use client';

import { useState, useMemo } from 'react';
import type { InputValues } from '@/types';
import { calcAllItems } from '@/lib/calculator';
import InputPanel from '@/components/InputPanel';
import RankingPanel from '@/components/RankingPanel';
import EfficiencyTab from '@/components/EfficiencyTab';
import ExpInfoTab from '@/components/ExpInfoTab';
import BMExpTab from '@/components/BMExpTab';
import EpicDungeonTab from '@/components/EpicDungeonTab';

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

const TABS = [
  '경험치 효율표',
  '경험치 정보',
  'BM 경험치',
  '에픽 던전',
] as const;
type Tab = typeof TABS[number];

export default function Home() {
  const [inputs, setInputs] = useState<InputValues>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<Tab>(TABS[0]);

  const handleChange = (key: keyof InputValues, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const rankedItems = useMemo(() => calcAllItems(inputs), [inputs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {'경험치 BM 효율표'}
            </h1>
            <p className="text-xs text-gray-400">
              Made by {'레틴'} / {'매화재해'}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
                  (activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100')
                }
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 py-6">
        {activeTab === TABS[0] ? (
          <div className="flex flex-col xl:flex-row gap-6">
            <main className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <EfficiencyTab inputs={inputs} onChange={handleChange} items={rankedItems} />
            </main>
            <aside className="xl:w-64 shrink-0 space-y-4">
              <InputPanel inputs={inputs} onChange={handleChange} />
              <RankingPanel items={rankedItems} />
            </aside>
          </div>
        ) : (
          <main className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
