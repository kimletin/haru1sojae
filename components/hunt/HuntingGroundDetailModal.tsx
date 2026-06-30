'use client';

import { useEffect, useState } from 'react';
import type { RegionMonster } from '@/data/regionMonsters';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

interface Props {
  region: string;
  groundName: string;
  imageSrc: string;
  mobDir: string;
  mobCount: number;
  monsters: RegionMonster[];
  onClose: () => void;
}

export default function HuntingGroundDetailModal({ region, groundName, imageSrc, mobDir, mobCount, monsters, onClose }: Props) {
  const [zoomed, setZoomed] = useState(false);
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-[960px] max-w-[95vw] max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 leading-tight">{region}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-zinc-100 leading-tight">{groundName}</div>
            </div>
            <span className="text-xs font-semibold bg-orange-200 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-2.5 py-0.5 rounded-full">{mobCount}마리</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
          >×</button>
        </div>

        <div className="relative mb-4">
          <img
            src={imageSrc}
            alt={groundName}
            onClick={() => setZoomed(true)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 cursor-zoom-in"
          />
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 bg-black/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 16 24" className="w-4 h-6 shrink-0"><ellipse cx="8" cy="12" rx="6" ry="10" fill="none" stroke="#00effe" strokeWidth="2.5" /></svg>
              <span className="text-xs text-white">히든포탈</span>
            </div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 16 20" className="w-4 h-5 shrink-0"><path d="M8 2 L8 14 M4 10 L8 16 L12 10" stroke="#ffff00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
              <span className="text-xs text-white">캐릭터 젠 위치</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-start gap-3">
          {monsters.length > 0 ? monsters.map(mon => (
            <div key={mon.name} className="w-80 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-4 flex items-center gap-3">
              <div className="w-28 h-28 shrink-0 flex items-center justify-center">
                <img
                  src={`/mobs/${encodeURIComponent(mobDir)}/${encodeURIComponent(mon.name)}.png`}
                  alt={mon.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-2">{mon.name}</div>
                <div className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-500 dark:text-zinc-400">레벨</span>
                  <span className="text-gray-800 dark:text-zinc-200">{mon.level}</span>
                </div>
                <div className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-500 dark:text-zinc-400">HP</span>
                  <span className="text-gray-800 dark:text-zinc-200">{mon.hp.toLocaleString('ko-KR')}</span>
                </div>
                <div className="flex justify-between text-sm py-0.5">
                  <span className="text-gray-500 dark:text-zinc-400">경험치</span>
                  <span className="text-gray-800 dark:text-zinc-200">{mon.exp.toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-400 dark:text-zinc-500 py-4 self-center">몬스터 정보가 없습니다.</p>
          )}
        </div>
      </div>
      {zoomed && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <img src={imageSrc} alt={groundName} className="max-w-[95vw] max-h-[95vh] object-contain" />
        </div>
      )}
    </div>
  );
}
