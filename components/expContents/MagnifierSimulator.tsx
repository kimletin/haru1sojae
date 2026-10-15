'use client';
// 돋보기 시뮬레이터 — 이벤트 한정(탐정 예티의 수상한 돋보기). 종료 후 메뉴와 함께 지운다.
//
// 다른 시뮬레이터와 다른 점:
//  · 1개당 경험치가 캐릭터 레벨이 아니라 '사냥터 몹 레벨'로 정해지고, 레벨이 올라도 변하지 않는다
//    → 레벨 구간마다 표를 갈아 끼울 필요가 없어 총 경험치 = 개수 × 1개 경험치로 끝난다
//  · 그래서 '목표 레벨' 모드 없이 '개수 → 결과'만 둔다
import { useEffect, useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import Num from '@/components/ui/Num';
import SimNumInput from '@/components/expContents/SimNumInput';
import { LEVEL_EXP } from '@/data/levelExp';
import { MONSTER_EXP } from '@/data/monsterExp';
import { calcLevelUp } from '@/components/expContents/simMath';

interface Props {
  charLevel: number;
  /** 사냥터 몹 레벨 — 돋보기 1개당 경험치의 기준 */
  monsterLevel: number;
  hasCharacter: boolean;
  todayExpRate?: number | null;
  slotKey?: number;
  /** 부스터몹 1마리 = 일반 몹 몇 마리분 (수상한 10 / 예티 800) */
  mobRate: number;
  /** 추가 경험치 획득량(%) 기본값 — 예티 돋보기는 받지 않으므로 null */
  expBonus: number | null;
}

type SimResult = { gainedExp: number; gainPct: number; finalLevel: number; finalPct: number };

const SPAWN_COUNT = 190; // 100초 동안 10마리씩 19번

export default function MagnifierSimulator({ charLevel, monsterLevel, hasCharacter, todayExpRate, slotKey, mobRate, expBonus }: Props) {
  const [simLevel, setSimLevel] = useState(hasCharacter ? String(charLevel) : '');
  const [simExpPct, setSimExpPct] = useState('');
  const [simMobLevel, setSimMobLevel] = useState(hasCharacter ? String(monsterLevel) : '');
  const [simCount, setSimCount] = useState('');
  // 추가 경험치 획득량은 표와 따로 입력한다(표 값은 그대로 두고 다른 세팅을 돌려볼 수 있게)
  const [simBonus, setSimBonus] = useState(expBonus != null && expBonus > 0 ? String(expBonus) : '');
  const [result, setResult] = useState<SimResult | null>(null);

  useEffect(() => {
    setSimBonus(expBonus != null && expBonus > 0 ? String(expBonus) : '');
  }, [expBonus]);

  useEffect(() => {
    if (todayExpRate != null) setSimExpPct(todayExpRate.toFixed(3));
  }, [todayExpRate]);

  useEffect(() => {
    setSimLevel(hasCharacter ? String(charLevel) : '');
    setSimMobLevel(hasCharacter ? String(monsterLevel) : '');
    setResult(null);
  }, [slotKey, charLevel, monsterLevel, hasCharacter]);

  /** 돋보기 1개가 주는 경험치 */
  const oneExp = (mobLv: number) =>
    (MONSTER_EXP[mobLv] ?? 0) * mobRate * SPAWN_COUNT * (expBonus == null ? 1 : 1 + (parseFloat(simBonus) || 0) / 100);

  const handleCalc = () => {
    const lv = parseInt(simLevel) || 0;
    const mobLv = parseInt(simMobLevel) || 0;
    const expPct = Math.min(100, Math.max(0, parseFloat(simExpPct) || 0));
    const count = parseInt(simCount);
    if (!LEVEL_EXP[lv] || !MONSTER_EXP[mobLv] || !count || count <= 0) return;
    const gainedExp = oneExp(mobLv) * count;
    const r = calcLevelUp(lv, expPct, gainedExp);
    if (!r) return;
    setResult({
      gainedExp,
      gainPct: (r.finalLevel - lv) * 100 + r.finalPct - expPct,
      finalLevel: r.finalLevel,
      finalPct: r.finalPct,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
      <CardHeader title="시뮬레이터" className="shrink-0" />
      <div className="p-4 flex flex-col gap-3">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500 leading-relaxed">
          사냥터 몹 레벨과 개수를 입력하면 획득 경험치와 도달 레벨을 계산합니다.
          {expBonus == null && ' 이 아이템은 추가 경험치 획득량의 영향을 받지 않습니다.'}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
            <SimNumInput value={simLevel} onChange={setSimLevel} unit="레벨" pad="7" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 경험치</span>
            <SimNumInput value={simExpPct} onChange={setSimExpPct} decimal unit="%" pad="4" placeholder="0.000" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">사냥터 몹 레벨</span>
            <SimNumInput value={simMobLevel} onChange={setSimMobLevel} unit="레벨" pad="7" />
          </div>
          {expBonus != null && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">추가 경험치 획득량</span>
              <SimNumInput value={simBonus} onChange={setSimBonus} unit="%" pad="4" />
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">개수</span>
            <SimNumInput value={simCount} onChange={setSimCount} unit="개" pad="5" />
          </div>
        </div>
        {(() => {
          const lv = parseInt(simLevel);
          const mobLv = parseInt(simMobLevel);
          const expPct = parseFloat(simExpPct);
          const count = parseInt(simCount);
          let reason: string | null = null;
          if (simLevel === '' || isNaN(lv)) reason = '레벨을 입력해주세요';
          else if (lv < 260 || lv > 299) reason = '레벨이 올바르지 않아요';
          else if (simExpPct !== '' && (isNaN(expPct) || expPct < 0 || expPct > 100)) reason = '경험치%가 올바르지 않아요';
          else if (simMobLevel === '' || isNaN(mobLv)) reason = '사냥터 몹 레벨을 입력해주세요';
          else if (!MONSTER_EXP[mobLv]) reason = '사냥터 몹 레벨이 올바르지 않아요';
          else if (simCount === '' || isNaN(count)) reason = '개수를 입력해주세요';
          else if (count < 1 || count > 99999) reason = '개수가 올바르지 않아요';
          return (
            <button onClick={handleCalc} disabled={!!reason} className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              {reason ?? '계산하기'}
            </button>
          );
        })()}
        <div className="mt-1 flex flex-col gap-2.5 border-t border-gray-100 dark:border-zinc-700 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-zinc-400">획득 경험치</span>
            <div className="text-right">
              {result
                ? <><span className="font-bold text-orange-600 dark:text-orange-400"><Num n={result.gainedExp} /></span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">(+{result.gainPct.toFixed(3)}%)</span></>
                : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-zinc-400">달성 레벨</span>
            <div className="text-right">
              {result
                ? <><span className="font-bold text-gray-800 dark:text-zinc-100">Lv.{result.finalLevel}</span><span className="ml-1.5 text-sm text-orange-400 dark:text-orange-500">{result.finalPct.toFixed(3)}%</span></>
                : <span className="font-bold text-gray-300 dark:text-zinc-600">-</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
