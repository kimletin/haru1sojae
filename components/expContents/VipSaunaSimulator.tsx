'use client';
import { useEffect, useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import { LEVEL_EXP } from '@/data/levelExp';
import { calcVipSaunaByTime, calcVipSaunaByTarget, findStartForTarget, type RevStartResult } from '@/components/expContents/simMath';

interface Props {
  charLevel: number;
  hasCharacter: boolean;
  todayExpRate?: number | null;
  slotKey?: number;
}

type VipSimResult =
  | { type: '시간'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
  | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; hours: number; minutes: number; seconds: number };

export default function VipSaunaSimulator({ charLevel, hasCharacter, todayExpRate, slotKey }: Props) {
  // 시뮬레이터 state
  const [vipSimLevel, setVipSimLevel] = useState(hasCharacter ? String(charLevel) : "");
  const [vipSimExpPct, setVipSimExpPct] = useState('');
  const [vipSimBeyond, setVipSimBeyond] = useState(false);
  const [vipSimMode, setVipSimMode] = useState<'목표' | '시간'>('시간');
  const [vipSimTarget, setVipSimTarget] = useState('');
  const [vipSimHours, setVipSimHours] = useState('');
  const [vipSimMinutes, setVipSimMinutes] = useState('');
  const [vipSimResult, setVipSimResult] = useState<VipSimResult | null>(null);

  // 역산 시뮬레이터 state
  const [vipRevTarget, setVipRevTarget] = useState('');
  const [vipRevHours, setVipRevHours] = useState('');
  const [vipRevMinutes, setVipRevMinutes] = useState('');
  const [vipRevBeyond, setVipRevBeyond] = useState(false);
  const [vipRevResult, setVipRevResult] = useState<RevStartResult | null>(null);

  // 오늘 경험치 자동 입력
  useEffect(() => {
    if (todayExpRate != null) setVipSimExpPct(todayExpRate.toFixed(3));
  }, [todayExpRate]);

  // 슬롯/레벨 변경 시 리셋
  useEffect(() => {
    setVipSimLevel(hasCharacter ? String(charLevel) : '');
    setVipSimResult(null);
    setVipRevResult(null);
  // slotKey가 바뀌면 charLevel이 같아도 강제 갱신
  }, [slotKey, charLevel, hasCharacter]);

  const handleVipSimCalc = () => {
    const lv = parseInt(vipSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(vipSimExpPct) || 0));
    if (!LEVEL_EXP[lv]) return;
    if (vipSimMode === '시간') {
      const hours = parseInt(vipSimHours) || 0;
      const minutes = parseInt(vipSimMinutes) || 0;
      const totalSeconds = hours * 3600 + minutes * 60;
      if (totalSeconds <= 0) return;
      const res = calcVipSaunaByTime(lv, expPct, totalSeconds, vipSimBeyond);
      const gainPct = (res.finalLevel - lv) * 100 + res.finalPct - expPct;
      setVipSimResult({ type: '시간', gainedExp: res.gainedExp, gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(vipSimTarget);
      if (!targetLv || targetLv <= lv || (targetLv < 300 && !LEVEL_EXP[targetLv])) return;
      const res = calcVipSaunaByTarget(lv, expPct, targetLv, vipSimBeyond);
      if (!res) return;
      setVipSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, hours: res.hours, minutes: res.minutes, seconds: res.seconds });
    }
  };

  const handleVipRevCalc = () => {
    const targetLv = parseInt(vipRevTarget);
    const hours = parseInt(vipRevHours) || 0;
    const minutes = parseInt(vipRevMinutes) || 0;
    const totalSeconds = hours * 3600 + minutes * 60;
    if (!targetLv || targetLv < 261 || targetLv > 300) return;
    if (totalSeconds <= 0) return;
    const res = findStartForTarget(targetLv, (sl, sp) => {
      const r = calcVipSaunaByTime(sl, sp, totalSeconds, vipRevBeyond);
      return { finalLevel: r.finalLevel, finalPct: r.finalPct };
    });
    if (!res) { setVipRevResult({ ok: false, msg: '시간이 너무 길어요 (260레벨 이전 필요)' }); return; }
    setVipRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
        <CardHeader title="시뮬레이터" className="shrink-0" />
        <div className="p-4 flex flex-col gap-3">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">현재 레벨·경험치와 잠수 시간(또는 목표 레벨)을 입력하면 도달 레벨을 계산합니다.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="numeric" value={vipSimLevel} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimLevel(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                  placeholder="0" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="decimal" value={vipSimExpPct} onChange={e => { const v = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); setVipSimExpPct(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-4"
                  placeholder="0.000" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
              <button
                onClick={() => setVipSimBeyond(v => !v)}
                disabled={parseInt(vipSimLevel) >= 279}
                className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                  (parseInt(vipSimLevel) >= 279
                    ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                    : 'cursor-pointer ' + (vipSimBeyond
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400'))}
              >
                버닝 BEYOND
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
              <div className="flex gap-1">
                {(['시간', '목표'] as const).map(m => (
                  <button key={m} onClick={() => { setVipSimMode(m); setVipSimResult(null); }}
                    className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (vipSimMode === m
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {vipSimMode === '목표' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                <div className="relative flex items-center">
                  <input type="text" inputMode="numeric" value={vipSimTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                    placeholder="0" />
                  <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
                </div>
              </div>
            )}
            {vipSimMode === '시간' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">잠수 시간</span>
                <div className="flex items-center gap-1">
                  <div className="relative flex items-center">
                    <input type="text" inputMode="numeric" value={vipSimHours} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimHours(v); }} className="w-[60px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                      placeholder="0" />
                    <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">시간</span>
                  </div>
                  <div className="relative flex items-center">
                    <input type="text" inputMode="numeric" value={vipSimMinutes} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipSimMinutes(v); }} className="w-[44px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                      placeholder="0" />
                    <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">분</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {(() => {
            const lv = parseInt(vipSimLevel);
            const expPct = parseFloat(vipSimExpPct);
            const target = parseInt(vipSimTarget);
            const hours = parseInt(vipSimHours);
            const minutes = parseInt(vipSimMinutes);
            let reason: string | null = null;
            if (vipSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
            else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
            else if (vipSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
            else if (vipSimMode === '목표') {
              if (vipSimTarget === '' || isNaN(target)) reason = '목표 레벨을 입력해주세요';
              else if (target <= lv || target > 300) reason = '목표 레벨이 올바르지 않아요';
            } else if (vipSimMode === '시간') {
              if ((vipSimHours !== '' && (isNaN(hours) || hours < 0 || hours > 999)) || (vipSimMinutes !== '' && (isNaN(minutes) || minutes < 0 || minutes > 59))) reason = '시간이 올바르지 않아요';
              else if ((hours || 0) === 0 && (minutes || 0) === 0) reason = '시간을 입력해주세요';
            }
            return (
              <button onClick={handleVipSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            {vipSimMode === '목표' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">소요 시간</span>
                {vipSimResult && vipSimResult.type === '목표'
                  ? <span className="font-bold text-gray-800 dark:text-zinc-100">{vipSimResult.hours > 0 ? `${vipSimResult.hours}시간 ` : ''}{vipSimResult.minutes > 0 ? `${vipSimResult.minutes}분 ` : ''}{vipSimResult.seconds > 0 ? `${vipSimResult.seconds}초` : (vipSimResult.hours === 0 && vipSimResult.minutes === 0 ? '0초' : '')}</span>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
              <div className="text-right">
                {vipSimResult
                  ? <><span className="font-bold text-orange-600 dark:text-orange-400">{vipSimResult.gainPct.toFixed(3)}%</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+<Num n={vipSimResult.gainedExp} />)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
              <div className="text-right">
                {vipSimResult
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{vipSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{vipSimResult.finalPct.toFixed(3)}%</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
        <CardHeader title="목표 레벨 역산" className="shrink-0" />
        <div className="p-4 flex flex-col gap-3 flex-1">
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">목표 레벨과 잠수 시간을 입력하면, 어느 시점부터 사용하면 되는지 알려줍니다.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
              <div className="relative flex items-center">
                <input type="text" inputMode="numeric" value={vipRevTarget} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipRevTarget(v); }} className="w-20 text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                  placeholder="0" />
                <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">잠수 시간</span>
              <div className="flex items-center gap-1">
                <div className="relative flex items-center">
                  <input type="text" inputMode="numeric" value={vipRevHours} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipRevHours(v); }} className="w-[60px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-7"
                    placeholder="0" />
                  <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">시간</span>
                </div>
                <div className="relative flex items-center">
                  <input type="text" inputMode="numeric" value={vipRevMinutes} onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ''); setVipRevMinutes(v); }} className="w-[44px] text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-5"
                    placeholder="0" />
                  <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">분</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
              <button
                onClick={() => setVipRevBeyond(v => !v)}
                className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                  (vipRevBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                버닝 BEYOND
              </button>
            </div>
          </div>
          {(() => {
            const targetLv = parseInt(vipRevTarget);
            const h = parseInt(vipRevHours);
            const m = parseInt(vipRevMinutes);
            let reason: string | null = null;
            if (vipRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
            else if (targetLv < 261 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
            else if ((vipRevHours !== '' && (isNaN(h) || h < 0 || h > 999)) || (vipRevMinutes !== '' && (isNaN(m) || m < 0 || m > 59))) reason = '시간이 올바르지 않아요';
            else if ((h || 0) === 0 && (m || 0) === 0) reason = '시간을 입력해주세요';
            return (
              <button onClick={handleVipRevCalc} disabled={!!reason} className="mt-auto w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
              <div className="text-right">
                {vipRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{vipRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({vipRevResult.startPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">도달 레벨</span>
              <div className="text-right">
                {vipRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{vipRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            {vipRevResult && !vipRevResult.ok && (
              <p className="text-xs text-red-500 text-center">{vipRevResult.msg}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
