'use client';
import { useEffect, useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import SimNumInput from '@/components/expContents/SimNumInput';
import { LEVEL_EXP } from '@/data/levelExp';
import { calcCouponByCount, calcCouponByTarget, findStartForTarget, type RevStartResult } from '@/components/expContents/simMath';

interface Props {
  charLevel: number;
  hasCharacter: boolean;
  todayExpRate?: number | null;
  slotKey?: number;
}

type CouponSimResult =
  | { type: '개수'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
  | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; count: number };

export default function ExpCouponSimulator({ charLevel, hasCharacter, todayExpRate, slotKey }: Props) {
  // 시뮬레이터 state
  const [couponSimLevel, setCouponSimLevel] = useState(hasCharacter ? String(charLevel) : "");
  const [couponSimExpPct, setCouponSimExpPct] = useState('');
  const [couponSimBeyond, setCouponSimBeyond] = useState(false);
  const [couponSimMode, setCouponSimMode] = useState<'개수' | '목표'>('개수');
  const [couponSimCount, setCouponSimCount] = useState('');
  const [couponSimTarget, setCouponSimTarget] = useState('');
  const [couponSimResult, setCouponSimResult] = useState<CouponSimResult | null>(null);

  // 역산 시뮬레이터 state
  const [couponRevTarget, setCouponRevTarget] = useState('');
  const [couponRevCount, setCouponRevCount] = useState('');
  const [couponRevBeyond, setCouponRevBeyond] = useState(false);
  const [couponRevResult, setCouponRevResult] = useState<RevStartResult | null>(null);

  // 오늘 경험치 자동 입력
  useEffect(() => {
    if (todayExpRate != null) setCouponSimExpPct(todayExpRate.toFixed(3));
  }, [todayExpRate]);

  // 슬롯/레벨 변경 시 리셋
  useEffect(() => {
    setCouponSimLevel(hasCharacter ? String(charLevel) : '');
    setCouponSimResult(null);
    setCouponRevResult(null);
  // slotKey가 바뀌면 charLevel이 같아도 강제 갱신
  }, [slotKey, charLevel, hasCharacter]);

  const handleCouponSimCalc = () => {
    const lv = parseInt(couponSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(couponSimExpPct) || 0));
    if (!LEVEL_EXP[lv]) return;
    if (couponSimMode === '개수') {
      const count = parseInt(couponSimCount);
      if (!count || count <= 0) return;
      const res = calcCouponByCount(lv, expPct, count, couponSimBeyond);
      setCouponSimResult({ type: '개수', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(couponSimTarget);
      if (!targetLv || targetLv <= lv || (targetLv < 300 && !LEVEL_EXP[targetLv])) return;
      const res = calcCouponByTarget(lv, expPct, targetLv, couponSimBeyond);
      if (!res) return;
      setCouponSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, count: res.count });
    }
  };

  const handleCouponRevCalc = () => {
    const targetLv = parseInt(couponRevTarget);
    const count = parseInt(couponRevCount);
    if (!targetLv || targetLv < 261 || targetLv > 300) return;
    if (!count || count < 1 || count > 99999) return;
    const res = findStartForTarget(targetLv, (sl, sp) => calcCouponByCount(sl, sp, count, couponRevBeyond));
    if (!res) { setCouponRevResult({ ok: false, msg: '재화가 너무 많아요 (260레벨 이전 필요)' }); return; }
    setCouponRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
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
              <SimNumInput value={couponSimLevel} onChange={setCouponSimLevel} unit="레벨" pad="7" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
              <SimNumInput value={couponSimExpPct} onChange={setCouponSimExpPct} decimal unit="%" pad="4" placeholder="0.000" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
              <button
                onClick={() => setCouponSimBeyond(v => !v)}
                disabled={parseInt(couponSimLevel) >= 279}
                className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                  (parseInt(couponSimLevel) >= 279
                    ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                    : 'cursor-pointer ' + (couponSimBeyond
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400'))}
              >
                버닝 BEYOND
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
              <div className="flex gap-1">
                {(['개수', '목표'] as const).map(m => (
                  <button key={m} onClick={() => { setCouponSimMode(m); setCouponSimResult(null); }}
                    className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (couponSimMode === m
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {couponSimMode === '개수' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">쿠폰 개수</span>
                <SimNumInput value={couponSimCount} onChange={setCouponSimCount} unit="개" pad="5" />
              </div>
            )}
            {couponSimMode === '목표' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                <SimNumInput value={couponSimTarget} onChange={setCouponSimTarget} unit="레벨" pad="7" />
              </div>
            )}
          </div>
          {(() => {
            const lv = parseInt(couponSimLevel);
            const expPct = parseFloat(couponSimExpPct);
            const count = parseInt(couponSimCount);
            const target = parseInt(couponSimTarget);
            let reason: string | null = null;
            if (couponSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
            else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
            else if (couponSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
            else if (couponSimMode === '개수') {
              if (couponSimCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
              else if (count < 1 || count > 99999) reason = '개수가 올바르지 않아요';
            } else if (couponSimMode === '목표') {
              if (couponSimTarget === '' || isNaN(target)) reason = '목표 레벨을 입력해주세요';
              else if (target <= lv || target > 300) reason = '목표 레벨이 올바르지 않아요';
            }
            return (
              <button onClick={handleCouponSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            {couponSimMode === '목표' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">사용 개수</span>
                {couponSimResult && couponSimResult.type === '목표'
                  ? <span className="font-bold text-gray-800 dark:text-zinc-100">{couponSimResult.count.toLocaleString()}개</span>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
              <div className="text-right">
                {couponSimResult
                  ? <><span className="font-bold text-orange-600 dark:text-orange-400"><Num n={couponSimResult.gainedExp} /></span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{couponSimResult.gainPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
              <div className="text-right">
                {couponSimResult
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{couponSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{couponSimResult.finalPct.toFixed(3)}%</span></>
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
              <SimNumInput value={couponRevTarget} onChange={setCouponRevTarget} unit="레벨" pad="7" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
              <SimNumInput value={couponRevCount} onChange={setCouponRevCount} unit="개" pad="5" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
              <button
                onClick={() => setCouponRevBeyond(v => !v)}
                className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                  (couponRevBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                버닝 BEYOND
              </button>
            </div>
          </div>
          {(() => {
            const targetLv = parseInt(couponRevTarget);
            const count = parseInt(couponRevCount);
            let reason: string | null = null;
            if (couponRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
            else if (targetLv < 261 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
            else if (couponRevCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
            else if (count < 1 || count > 99999) reason = '개수가 올바르지 않아요';
            return (
              <button onClick={handleCouponRevCalc} disabled={!!reason} className="mt-auto w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
              <div className="text-right">
                {couponRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{couponRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({couponRevResult.startPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">도달 레벨</span>
              <div className="text-right">
                {couponRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{couponRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            {couponRevResult && !couponRevResult.ok && (
              <p className="text-xs text-red-500 text-center">{couponRevResult.msg}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
