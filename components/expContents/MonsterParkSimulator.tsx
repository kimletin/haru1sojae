'use client';
import { useEffect, useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { LEVEL_EXP } from '@/data/levelExp';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { calcLevelUp } from '@/components/expContents/simMath';
import type { SundayType } from '@/types';

const SUNDAY_MULT: Record<SundayType, number> = { '일반': 1, '썬데이': 1.5, '스페셜': 4 };

interface Props {
  charLevel: number;
  hasCharacter: boolean;
  todayExpRate?: number | null;
  slotKey?: number;
  monsterParkBonus: number;
}

export default function MonsterParkSimulator({ charLevel, hasCharacter, todayExpRate, slotKey, monsterParkBonus }: Props) {
  const [simLevel, setSimLevel] = useState(hasCharacter ? String(charLevel) : "");
  const [simExpPct, setSimExpPct] = useState('');
  const [simPotionBuff, setSimPotionBuff] = useState('');
  const [simBeyond, setSimBeyond] = useState(false);
  const [simRounds, setSimRounds] = useState(7);
  const [simSunday, setSimSunday] = useState<SundayType>('일반');
  const [simResult, setSimResult] = useState<{ gainedExp: number; gainPct: number; finalLevel: number; finalPct: number } | null>(null);

  // 오늘 경험치 자동 입력
  useEffect(() => {
    if (todayExpRate != null) setSimExpPct(todayExpRate.toFixed(3));
  }, [todayExpRate]);

  // 보약 자동 입력
  useEffect(() => {
    if (monsterParkBonus > 0) setSimPotionBuff(String(monsterParkBonus));
  }, [monsterParkBonus, slotKey]);

  // 슬롯/레벨 변경 시 리셋
  useEffect(() => {
    setSimLevel(hasCharacter ? String(charLevel) : '');
    setSimResult(null);
  // slotKey가 바뀌면 charLevel이 같아도 강제 갱신
  }, [slotKey, charLevel, hasCharacter]);

  const handleSimCalc = () => {
    const lv = parseInt(simLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(simExpPct) || 0));
    const potionBuff = parseFloat(simPotionBuff) || 0;
    if (!LEVEL_EXP[lv]) return;
    const baseExp = MONSTER_PARK_EXP[getMonsterParkZone(lv)];
    if (!baseExp) return;
    const simSundayPct = (SUNDAY_MULT[simSunday] - 1) * 100;
    const totalBonusPct = potionBuff + simSundayPct;
    const expPerRound = Math.round(baseExp * (1 + totalBonusPct / 100));
    const totalGained = expPerRound * simRounds;
    const res = calcLevelUp(lv, expPct, totalGained, simBeyond);
    if (!res) return;
    const gainPct = (res.finalLevel - lv) * 100 + res.finalPct - expPct;
    setSimResult({ gainedExp: totalGained, gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
      <CardHeader title="시뮬레이터" className="shrink-0" />
      <div className="p-4 flex flex-col gap-3">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 입장 횟수를 입력하면 도달 레벨을 계산합니다.</p>
        {/* 정보 행 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
            <div className="relative flex items-center">
              <input type="text" inputMode="numeric" value={simLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                placeholder="0" />
              <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-zinc-400">지역</span>
            {(() => {
              const lv = parseInt(simLevel);
              if (lv >= 300) return <span className="text-xs text-red-400 dark:text-red-500">300레벨 미만 입력해주세요</span>;
              if (lv >= 260) return <span className="text-sm text-orange-500 dark:text-orange-400 font-bold">{getMonsterParkZone(lv)}</span>;
              return <span className="text-xs text-red-400 dark:text-red-500">260레벨 이상 입력해주세요</span>;
            })()}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
            <div className="relative flex items-center">
              <input type="text" inputMode="decimal" value={simExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                placeholder="0.000" />
              <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">보약</span>
            <div className="relative flex items-center">
              <input type="text" inputMode="numeric" value={simPotionBuff} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setSimPotionBuff(v); }}
                className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                placeholder="0" />
              <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
            <button
              onClick={() => setSimBeyond(v => !v)}
              disabled={parseInt(simLevel) >= 279}
              className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                (parseInt(simLevel) >= 279
                  ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                  : 'cursor-pointer ' + (simBeyond
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400'))}
            >
              버닝 BEYOND
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">썬데이</span>
            <div className="flex gap-1">
              {([
                { val: '일반',   tip: '+0%' },
                { val: '썬데이', tip: '+50%' },
                { val: '스페셜', tip: '+300%' },
              ] as const).map(({ val, tip }) => (
                <TooltipWrapper key={val} tip={tip}>
                  <button
                    onClick={() => setSimSunday(val)}
                    className={
                      'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (simSunday === val
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')
                    }
                  >
                    {val === '스페셜' ? '스페셜썬데이' : val}
                  </button>
                </TooltipWrapper>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">판수</span>
          <div className="flex gap-1.5">
            {[1,2,3,4,5,6,7].map(r => (
              <button key={r} onClick={() => setSimRounds(r)}
                className={'flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors cursor-pointer ' + (simRounds === r ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-orange-100 dark:hover:bg-orange-900/30')}>
                {r}
              </button>
            ))}
          </div>
        </div>
        {(() => {
          const lv = parseInt(simLevel);
          const expPct = parseFloat(simExpPct);
          const buff = parseFloat(simPotionBuff);
          let reason: string | null = null;
          if (simLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
          else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
          else if (simExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
          else if (simPotionBuff !== '' && (isNaN(buff) || buff < 0 || buff > 100)) reason = '보약%가 올바르지 않아요';
          return (
            <button onClick={handleSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {reason ?? '계산하기'}
            </button>
          );
        })()}
        <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
            <div className="text-right">
              {simResult
                ? <><span className="font-bold text-orange-600 dark:text-orange-400"><Num n={simResult.gainedExp} /></span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{simResult.gainPct.toFixed(3)}%)</span></>
                : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
            <div className="text-right">
              {simResult
                ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{simResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{simResult.finalPct.toFixed(3)}%</span></>
                : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
