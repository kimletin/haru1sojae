'use client';

import { useState, useEffect } from 'react';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { LEVEL_EXP } from '@/data/levelExp';
import Num from '@/components/Num';

const SIM_KEY = 'haru1sojae-simulator';
const PRESETS_KEY = 'haru1sojae-presets';
const PRESET_NAMES_KEY = 'haru1sojae-preset-names';
const ACTIVE_PRESET_KEY = 'haru1sojae-active-preset';

function calcLevelUp(
  startLevel: number,
  startExpPct: number,
  gainedExp: number
): { finalLevel: number; finalPct: number } | null {
  if (!LEVEL_EXP[startLevel]) return null;
  const required = LEVEL_EXP[startLevel].required;
  let absExp = (startExpPct / 100) * required;
  let remaining = gainedExp;
  let lv = startLevel;

  while (remaining > 0) {
    const lvReq = LEVEL_EXP[lv]?.required;
    if (!lvReq) break;
    const needed = lvReq - absExp;
    if (remaining >= needed) {
      remaining -= needed;
      lv++;
      absExp = 0;
    } else {
      absExp += remaining;
      remaining = 0;
    }
  }

  const finalReq = LEVEL_EXP[lv]?.required;
  const finalPct = finalReq ? (absExp / finalReq) * 100 : 0;
  return { finalLevel: lv, finalPct };
}

interface SimState {
  nickname: string;
  level: number;
  expPct: string;
  potionBuff: string;
  rounds: number;
}

export default function SimulatorTab() {
  const [state, setState] = useState<SimState>({
    nickname: '',
    level: 260,
    expPct: '0.000',
    potionBuff: '0',
    rounds: 7,
  });
  const [result, setResult] = useState<{
    gainedExp: number;
    gainPct: number;
    finalLevel: number;
    finalPct: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const simRaw = localStorage.getItem(SIM_KEY);
      const sim = simRaw ? JSON.parse(simRaw) : null;

      const activeIdx = parseInt(localStorage.getItem(ACTIVE_PRESET_KEY) ?? '0') || 0;
      const presetsRaw = localStorage.getItem(PRESETS_KEY);
      const namesRaw = localStorage.getItem(PRESET_NAMES_KEY);

      let defaultNickname = '';
      let defaultLevel = 260;

      if (namesRaw) {
        try {
          const names = JSON.parse(namesRaw);
          const n = names?.[activeIdx];
          if (n && n !== 'null') defaultNickname = n;
        } catch {}
      }
      if (presetsRaw) {
        try {
          const presets = JSON.parse(presetsRaw);
          const lv = presets?.[activeIdx]?.charLevel;
          if (lv && lv >= 200) defaultLevel = lv;
        } catch {}
      }

      setState({
        nickname: sim?.nickname ?? defaultNickname,
        level:    sim?.level    ?? defaultLevel,
        expPct:   sim?.expPct   ?? '0.000',
        potionBuff: sim?.potionBuff ?? '0',
        rounds:   sim?.rounds   ?? 7,
      });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SIM_KEY, JSON.stringify(state)); } catch {}
  }, [state, loaded]);

  const calculate = () => {
    const level = Math.floor(state.level);
    const expPct = Math.min(99.999, Math.max(0, parseFloat(state.expPct) || 0));
    const potionBuff = parseFloat(state.potionBuff) || 0;
    if (!LEVEL_EXP[level]) return;

    const zone = getMonsterParkZone(level);
    const baseExp = MONSTER_PARK_EXP[zone];
    if (!baseExp) return;

    const expPerRound = Math.round(baseExp * (1 + potionBuff / 100));
    const totalGained = expPerRound * state.rounds;
    const required = LEVEL_EXP[level].required;
    const gainPct = (totalGained / required) * 100;

    const res = calcLevelUp(level, expPct, totalGained);
    if (!res) return;

    setResult({ gainedExp: totalGained, gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
  };

  const zone = getMonsterParkZone(state.level || 260);

  return (
    <div className="flex gap-4 items-start h-full">
      {/* 캐릭터 정보 */}
      <div className="w-[230px] shrink-0">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">캐릭터 정보</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">닉네임</span>
              <input
                type="text"
                value={state.nickname}
                onChange={e => setState(s => ({ ...s, nickname: e.target.value }))}
                className="border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 focus:outline-none focus:border-orange-400"
                placeholder="닉네임"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">레벨</span>
              <input
                type="number"
                value={state.level}
                onChange={e => setState(s => ({ ...s, level: parseInt(e.target.value) || 260 }))}
                className="border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 focus:outline-none focus:border-orange-400"
                min={200} max={300}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">현재 경험치</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={state.expPct}
                  onChange={e => setState(s => ({ ...s, expPct: e.target.value }))}
                  className="flex-1 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 focus:outline-none focus:border-orange-400"
                  step="0.001" min="0" max="99.999"
                  placeholder="0.000"
                />
                <span className="text-sm text-gray-400 dark:text-zinc-500 shrink-0">%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">보약버프</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={state.potionBuff}
                  onChange={e => setState(s => ({ ...s, potionBuff: e.target.value }))}
                  className="flex-1 border border-gray-200 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 focus:outline-none focus:border-orange-400"
                  step="1" min="0"
                  placeholder="0"
                />
                <span className="text-sm text-gray-400 dark:text-zinc-500 shrink-0">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 시뮬레이터 + 결과 */}
      <div className="flex-1 flex flex-col gap-3">
        {/* 몬스터파크 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">몬스터파크</h3>
          </div>
          <div className="px-5 py-4 flex flex-col gap-4">
            <div className="text-center text-xs text-gray-400 dark:text-zinc-500">
              Lv.{state.level || 260} → <span className="text-orange-500 dark:text-orange-400 font-semibold">{zone}</span> 구역 기준
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">판수</span>
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,7].map(r => (
                  <button
                    key={r}
                    onClick={() => setState(s => ({ ...s, rounds: r }))}
                    className={
                      'flex-1 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ' +
                      (state.rounds === r
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-orange-100 dark:hover:bg-orange-900/30')
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={calculate}
              className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer"
            >
              계산하기
            </button>
          </div>
        </div>

        {/* 결과 */}
        {result && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
              <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">결과</h3>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
                <div className="text-right">
                  <Num n={result.gainedExp} className="text-base font-bold text-orange-600 dark:text-orange-400" />
                  <span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{result.gainPct.toFixed(3)}%)</span>
                </div>
              </div>
              <div className="h-px bg-gray-100 dark:bg-zinc-700" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">달성</span>
                <div className="text-right">
                  <span className="text-base font-bold text-gray-800 dark:text-zinc-100">Lv.{result.finalLevel}</span>
                  <span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{result.finalPct.toFixed(3)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
