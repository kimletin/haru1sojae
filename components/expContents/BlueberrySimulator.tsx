'use client';
import { useEffect, useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import SimNumInput from '@/components/expContents/SimNumInput';
import { LEVEL_EXP } from '@/data/levelExp';
import { calcBlueberryByCount, calcBlueberryByTarget, findStartForTarget, type RevStartResult } from '@/components/expContents/simMath';

interface Props {
  charLevel: number;
  hasCharacter: boolean;
  todayExpRate?: number | null;
  slotKey?: number;
}

type BlueSimResult =
  | { type: '개수'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number }
  | { type: '목표'; gainedExp: number; gainPct: number; finalLevel: number; finalPct: number; count: number };

export default function BlueberrySimulator({ charLevel, hasCharacter, todayExpRate, slotKey }: Props) {
  // 시뮬레이터 state
  const [blueSimLevel, setBlueSimLevel] = useState(hasCharacter ? String(charLevel) : "");
  const [blueSimExpPct, setBlueSimExpPct] = useState('');
  const [blueSimBeyond, setBlueSimBeyond] = useState(false);
  const [blueSimMode, setBlueSimMode] = useState<'개수' | '목표'>('개수');
  const [blueSimCount, setBlueSimCount] = useState('');
  const [blueSimTarget, setBlueSimTarget] = useState('');
  const [blueSimResult, setBlueSimResult] = useState<BlueSimResult | null>(null);

  // 역산(목표 레벨 -> 시작 시점) 시뮬레이터 state
  const [blueRevTarget, setBlueRevTarget] = useState('');
  const [blueRevCount, setBlueRevCount] = useState('');
  const [blueRevBeyond, setBlueRevBeyond] = useState(false);
  const [blueRevResult, setBlueRevResult] = useState<RevStartResult | null>(null);

  // 오늘 경험치 자동 입력
  useEffect(() => {
    if (todayExpRate != null) setBlueSimExpPct(todayExpRate.toFixed(3));
  }, [todayExpRate]);

  // 슬롯/레벨 변경 시 리셋
  useEffect(() => {
    setBlueSimLevel(hasCharacter ? String(charLevel) : '');
    setBlueSimResult(null);
    setBlueRevResult(null);
  // slotKey가 바뀌면 charLevel이 같아도 강제 갱신
  }, [slotKey, charLevel, hasCharacter]);

  const handleBlueSimCalc = () => {
    const lv = parseInt(blueSimLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(blueSimExpPct) || 0));
    if (!LEVEL_EXP[lv] || lv < 260 || lv > 299) return;
    if (blueSimMode === '개수') {
      const count = parseInt(blueSimCount);
      if (!count || count < 1 || count > 99) return;
      const res = calcBlueberryByCount(lv, expPct, count, blueSimBeyond);
      setBlueSimResult({ type: '개수', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct });
    } else {
      const targetLv = parseInt(blueSimTarget);
      if (!targetLv || targetLv <= lv || targetLv > 300) return;
      const res = calcBlueberryByTarget(lv, expPct, targetLv, blueSimBeyond);
      if (!res) return;
      setBlueSimResult({ type: '목표', gainedExp: res.gainedExp, gainPct: res.gainPct, finalLevel: res.finalLevel, finalPct: res.finalPct, count: res.count });
    }
  };

  const handleBlueRevCalc = () => {
    const targetLv = parseInt(blueRevTarget);
    const count = parseInt(blueRevCount);
    if (!targetLv || targetLv < 261 || targetLv > 300) return;
    if (!count || count < 1 || count > 99) return;
    const res = findStartForTarget(targetLv, (sl, sp) => calcBlueberryByCount(sl, sp, count, blueRevBeyond));
    if (!res) { setBlueRevResult({ ok: false, msg: '재화가 너무 많아요 (260레벨 이전 필요)' }); return; }
    setBlueRevResult({ ok: true, startLevel: res.startLevel, startPct: res.startPct, targetLevel: targetLv });
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
              <SimNumInput value={blueSimLevel} onChange={setBlueSimLevel} unit="레벨" pad="7" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
              <SimNumInput value={blueSimExpPct} onChange={setBlueSimExpPct} decimal unit="%" pad="4" placeholder="0.000" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
              <button
                onClick={() => setBlueSimBeyond(v => !v)}
                disabled={parseInt(blueSimLevel) >= 279}
                className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ' +
                  (blueSimBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                버닝 BEYOND
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">종류</span>
              <div className="flex gap-1">
                {(['개수', '목표'] as const).map(m => (
                  <button key={m} onClick={() => { setBlueSimMode(m); setBlueSimResult(null); }}
                    className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (blueSimMode === m ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>{m}</button>
                ))}
              </div>
            </div>
            {blueSimMode === '개수' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
                <SimNumInput value={blueSimCount} onChange={setBlueSimCount} unit="개" pad="5" />
              </div>
            )}
            {blueSimMode === '목표' && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">목표 레벨</span>
                <SimNumInput value={blueSimTarget} onChange={setBlueSimTarget} unit="레벨" pad="7" />
              </div>
            )}
          </div>
          {(() => {
            const lv = parseInt(blueSimLevel);
            const expPct = parseFloat(blueSimExpPct);
            let reason: string | null = null;
            if (blueSimLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
            else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
            else if (blueSimExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
            else if (blueSimMode === '개수') {
              const count = parseInt(blueSimCount);
              if (blueSimCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
              else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
            } else {
              const targetLv = parseInt(blueSimTarget);
              if (blueSimTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
              else if (targetLv <= lv || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
            }
            return (
              <button onClick={handleBlueSimCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            {blueSimMode === '목표' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-zinc-400">필요 개수</span>
                <div className="text-right">
                  {blueSimResult && blueSimResult.type === '목표'
                    ? <><span className="font-bold text-gray-800 dark:text-zinc-100">{blueSimResult.count.toLocaleString()}</span><span className="ml-1 text-sm text-gray-500 dark:text-zinc-400">개</span></>
                    : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
              <div className="text-right">
                {blueSimResult
                  ? <><span className="font-bold text-orange-600 dark:text-orange-400"><Num n={blueSimResult.gainedExp} /></span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{blueSimResult.gainPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
              <div className="text-right">
                {blueSimResult
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{blueSimResult.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({blueSimResult.finalPct.toFixed(3)}%)</span></>
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
              <SimNumInput value={blueRevTarget} onChange={setBlueRevTarget} unit="레벨" pad="7" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
              <SimNumInput value={blueRevCount} onChange={setBlueRevCount} unit="개" pad="5" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">버닝</span>
              <button
                onClick={() => setBlueRevBeyond(v => !v)}
                className={'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                  (blueRevBeyond ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400')}>
                버닝 BEYOND
              </button>
            </div>
          </div>
          {(() => {
            const targetLv = parseInt(blueRevTarget);
            const count = parseInt(blueRevCount);
            let reason: string | null = null;
            if (blueRevTarget === '' || isNaN(targetLv)) reason = '목표 레벨을 입력해주세요';
            else if (targetLv < 261 || targetLv > 300) reason = '목표 레벨이 올바르지 않아요';
            else if (blueRevCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
            else if (count < 1 || count > 99) reason = '개수가 올바르지 않아요';
            return (
              <button onClick={handleBlueRevCalc} disabled={!!reason} className="mt-auto w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {reason ?? '계산하기'}
              </button>
            );
          })()}
          <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">사용 시작</span>
              <div className="text-right">
                {blueRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{blueRevResult.startLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">({blueRevResult.startPct.toFixed(3)}%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-zinc-400">도달 레벨</span>
              <div className="text-right">
                {blueRevResult?.ok
                  ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{blueRevResult.targetLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(0.000%)</span></>
                  : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
              </div>
            </div>
            {blueRevResult && !blueRevResult.ok && (
              <p className="text-xs text-red-500 text-center">{blueRevResult.msg}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
