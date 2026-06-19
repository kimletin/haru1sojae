'use client';

import { useState, useEffect } from 'react';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';
import type { HuntingGround } from '@/data/huntingGrounds';
import type { MobGroup } from '@/types';

interface Props {
  currentRegion: string;
  currentGround: string;
  charLevel: number;
  onConfirm: (region: string, ground: HuntingGround) => void;
  onClose: () => void;
}

function regionMinLevel(regionName: string): number {
  const region = HUNTING_REGIONS.find(r => r.name === regionName);
  if (!region) return 0;
  return Math.min(...region.grounds.flatMap(g => g.mobs.map(m => m.level)));
}

function mobLevelLabel(mobs: MobGroup[]): string {
  const levels = [...new Set(mobs.map(m => m.level))];
  return levels.length === 1 ? `Lv.${levels[0]}` : levels.map(l => `Lv.${l}`).join(' / ');
}

function regionLevelRange(regionName: string): string {
  const region = HUNTING_REGIONS.find(r => r.name === regionName);
  if (!region) return '';
  const levels = region.grounds.flatMap(g => g.mobs.map(m => m.level));
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  return min === max ? `${min}` : `${min}~${max}`;
}

export default function HuntingGroundModal({ currentRegion, currentGround, charLevel, onConfirm, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const [selectedRegion, setSelectedRegion] = useState(currentRegion);

  const region = HUNTING_REGIONS.find(r => r.name === selectedRegion) ?? HUNTING_REGIONS[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-[540px] max-h-[540px] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-700 shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">사냥터 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
          >×</button>
        </div>

        {/* 바디: 지역 목록 + 사냥터 목록 */}
        <div className="flex flex-1 min-h-0">
          {/* 지역 목록 */}
          <div className="w-[130px] shrink-0 border-r border-gray-100 dark:border-zinc-700 overflow-y-auto py-2">
            {HUNTING_REGIONS.map(r => {
              const locked = charLevel < regionMinLevel(r.name);
              const active = selectedRegion === r.name;
              return (
                <button
                  key={r.name}
                  onClick={() => !locked && setSelectedRegion(r.name)}
                  disabled={locked}
                  className={
                    'w-full text-center px-4 py-2 transition-colors ' +
                    (locked
                      ? 'cursor-not-allowed opacity-35'
                      : active
                        ? 'cursor-pointer bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                        : 'cursor-pointer text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800')
                  }
                >
                  <div className={'text-sm ' + (active && !locked ? 'font-semibold' : '')}>{r.name}</div>
                  <div className={
                    'text-[11px] mt-0.5 ' +
                    (active && !locked ? 'text-orange-400 dark:text-orange-500' : 'text-gray-400 dark:text-zinc-500')
                  }>Lv.{regionLevelRange(r.name)}</div>
                </button>
              );
            })}
          </div>

          {/* 사냥터 목록 */}
          <div className="flex-1 overflow-y-auto py-2">
            {region.grounds.map(g => {
              const isSelected = selectedRegion === currentRegion && g.name === currentGround;
              const totalMobs = g.mobs.reduce((s, m) => s + m.count, 0);
              return (
                <button
                  key={g.name}
                  onClick={() => { onConfirm(selectedRegion, g); onClose(); }}
                  className={
                    'w-full text-left px-4 py-2 transition-colors cursor-pointer flex items-center justify-between gap-2 ' +
                    (isSelected
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800')
                  }
                >
                  <span className="text-sm">{g.name}</span>
                  <span className={
                    'text-xs shrink-0 ' +
                    (isSelected ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')
                  }>
                    {mobLevelLabel(g.mobs)} · {totalMobs}마리
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
