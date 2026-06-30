'use client';
import { useEffect, useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import { LEVEL_EXP } from '@/data/levelExp';
import { calcMekaberryByCount, calcMekaberryByTarget, findStartForTarget, type RevStartResult } from '@/components/expContents/simMath';

interface Props {
  charLevel: number;
  hasCharacter: boolean;
  todayExpRate?: number | null;
  slotKey?: number;
}

type MekaSimResult =
  | { type: '개수'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
  | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; count: number };

export default function MekaberrySimulator({ charLevel, hasCharacter, todayExpRate, slotKey }: Props) {
  // 시뮬레이터 state
  const [mekaSimLevel, setMekaSimLevel] = useState(hasCharacter ? String(charLevel) : "");
  const [mekaSimExpPct, setMekaSimExpPct] = useState('');
  const [mekaSimMode, setMekaSimMode] = useState<'개수' | '목표'>('개수');
  const [mekaSimCount, setMekaSimCount] = useState('');
  const [mekaSimTarget, setMekaSimTarget] = useState('');
  const [mekaSimResult, setMekaSimResult] = useState<MekaSimResult | null>(null);

  // 역산 시뮬레이터 state
  const [mekaRevTarget, setMekaRevTarget] = useState('');
  const [mekaRevCount, setMekaRevCount] = useState('');
  const [mekaRevResult, setMekaRevResult] = useState<RevStartResult | null>(null);

  // 오늘 경험치 자동 입력
  useEffect(() => {
    if (todayExpRate != null) setMekaSimExpPct(todayExpRate.toFixed(3));
  }, [todayExpRate]);

  // 슬롯/레벨 변경 시 리셋
  useEffect(() => {
    setMekaSimLevel(hasCharacter ? String(charLevel) : '');
    setMekaSimResult(null);
    setMekaRevResult(null);
  // slotKey가 바뀌면 charLevel이 같아도 강제 갱신
  }, [slotKey, charLevel, hasCharacter]);

  const handleMekaSimCalc = () => {
    const lv = parseInt(mekaSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(mekaSimExpPct) || 0));
    if (!LEVEL_EXP[lv] || lv < 280 || lv > 299) return;
    if (mekaSimMode === '개수') {
      const count = parseInt(mekaSimCount);
      if (!count || count < 1 || count > 99) return;
      const res = calcMekaberryByCount(lv, expPct, count);
      setMekaSimResult({ type: '개수', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(mekaSimTarget);
      if (!targetLv || targetLv <= lv || targetLv > 300) return;
      const res = calcMekaberryByTarget(lv, expPct, targetLv);
      if (!res) return;
      setMekaSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, count: res.count });
    }
  };

  const handleMekaRevCalc = () => {
    const targetLv = parseInt(mekaRevTarget);
    const count = parseInt(mekaRevCount);
    if (!targetLv || targetLv < 281 || targetLv > 300) return;
    if (!count || count < 1 || count > 99) return;
    const res = findStartForTarget(targetLv, (sl, sp) => calcMekaberryByCount(sl, sp, count));
    if (!res) { setMekaRevResult({ ok: false, msg: '재화가 너무 많아요 (280레벨 이전 필요)' }); return; }
    setMekaRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
        <CardHeader title="시뮬레이터" className="shrink-0" />
        <div className="p-4 flex flex-col gap-3">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 개수(또는 목표 레벨)를 입력하면 도달 레벨을 계산합니다.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="numeric" value={mekaSimLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                  placeholder="0" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="decimal" value={mekaSimExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setMekaSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                  placeholder="0.000" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
              <div className="flex gap-1">
                {(['개수', '목표'] as const).map(m => (
                  <button key={m} onClick={() => { setMekaSimMode(m); setMekaSimResult(null); }}
                    className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (mekaSimMode === m ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>{m}</button>
                ))}
              </div>
            </div>
            {mekaSimMode === '개수' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                <div className="relative flex items-center">
                  <input type="text" inputMode="numeric" value={mekaSimCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaSimCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                    placeholder="0" />
                  <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
                </div>
              </div>
            )}
            {mekaSimMode === '목표' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                <div className="relative flex items-center">
                  <input type="text" inputMode="numeric" value={mekaSimTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaSimTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                    placeholder="0" />
                  <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                </div>
              </div>
            )}
          </div>
          {(() => {
            const lv = parseInt(mekaSimLevel);
            const expPct = parseFloat(mekaSimExpPct);
            let reason: string | null = null;
            if (mekaSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
            else if (lv < 280 || lv > 299) reason = '레벨이 올바르지 않아요';
            else if (mekaSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
            else if (mekaSimMode === '개수') {
              const count = parseInt(mekaSimCount);
              if (mekaSimCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
              else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
            } else {
              const targetLv = parseInt(mekaSimTarget);
              if (mekaSimTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
              else if (targetLv <= lv || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
            }
            return (
              <button onClick={handleMekaSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            {mekaSimMode === '목표' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">필요 개수</span>
                <div className="text-right">
                  {mekaSimResult && mekaSimResult.type === '목표'
                    ? <><span className="font-bold text-gray-800 dark:text-zinc-100">{mekaSimResult.count.toLocaleString()}</span><span className="ml-1 text-sm text-gray-500 dark:text-zinc-400">개</span></>
                    : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
              <div className="text-right">
                {mekaSimResult
                  ? <><span className="font-bold text-orange-600 dark:text-orange-400">{mekaSimResult.gainPct.toFixed(3)}%</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+<Num n={mekaSimResult.gainedExp} />)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
              <div className="text-right">
                {mekaSimResult
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{mekaSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({mekaSimResult.finalPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
        <CardHeader title="목표 레벨 역산" className="shrink-0" />
        <div className="p-4 flex flex-col gap-3 flex-1">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">목표 레벨과 개수를 입력하면, 어느 시점부터 사용하면 되는지 알려줍니다.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="numeric" value={mekaRevTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaRevTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                  placeholder="0" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="numeric" value={mekaRevCount} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setMekaRevCount(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                  placeholder="0" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">개</span>
              </div>
            </div>
          </div>
          {(() => {
            const targetLv = parseInt(mekaRevTarget);
            const count = parseInt(mekaRevCount);
            let reason: string | null = null;
            if (mekaRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
            else if (targetLv < 281 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
            else if (mekaRevCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
            else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
            return (
              <button onClick={handleMekaRevCalc} disabled={!!reason} className="mt-auto w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
              <div className="text-right">
                {mekaRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{mekaRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({mekaRevResult.startPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">도달 레벨</span>
              <div className="text-right">
                {mekaRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{mekaRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            {mekaRevResult && !mekaRevResult.ok && (
              <p className="text-xs text-red-500 text-center">{mekaRevResult.msg}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
