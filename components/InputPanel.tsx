'use client';

import { useState, useEffect } from 'react';
import { InputValues, MobGroup } from '@/types';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';
import HuntingGroundModal from '@/components/HuntingGroundModal';
import TooltipWrapper from '@/components/TooltipWrapper';

function TooltipIcon({ text }: { text: React.ReactNode }) {
  return (
    <TooltipWrapper tip={text} tipClassName="!whitespace-normal w-52 leading-relaxed">
      <span className="text-xs text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-600 rounded-full w-4 h-4 flex items-center justify-center cursor-default select-none">?</span>
    </TooltipWrapper>
  );
}

interface Props {
  inputs: InputValues;
  onApply: (values: InputValues) => void;
}

function toTimeStr(sessions: number): string {
  const h = Math.floor(sessions / 2);
  const m = (sessions % 2) * 30;
  return `${h}시간 ${String(m).padStart(2, '0')}분`;
}

function NumInput({ label, value, onChange, min, max, width = 'w-[96px]', unit, disabled }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; width?: string; unit?: string; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const display = focused ? String(value) : value.toLocaleString('ko-KR');

  return (
    <div className="flex items-center gap-3 py-1">
      <label className={`text-sm whitespace-nowrap flex-1 ${disabled ? "text-gray-400 dark:text-zinc-500" : "text-gray-700 dark:text-zinc-300"}`}>{label}</label>
      {unit ? (
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="numeric"
            value={display}
            min={min}
            max={max}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={e => {
              const raw = Number(e.target.value.replace(/,/g, ''));
              if (!isNaN(raw)) {
                const clamped = Math.min(max !== undefined ? max : raw, Math.max(min !== undefined ? min : raw, raw));
                onChange(clamped);
              }
            }}
            disabled={disabled}
            className={`${width} text-center text-[12px] border-2 rounded px-1.5 ${unit && unit.length > 1 ? "pr-6" : "pr-4"} py-0 h-[24px] focus:outline-none ${disabled ? "border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed" : "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400"}`}
          />
          <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">{unit}</span>
        </div>
      ) : (
        <input
          type="text"
          inputMode="numeric"
          value={display}
          min={min}
          max={max}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => {
            const raw = Number(e.target.value.replace(/,/g, ''));
            if (!isNaN(raw)) {
              const clamped = Math.min(max !== undefined ? max : raw, Math.max(min !== undefined ? min : raw, raw));
              onChange(clamped);
            }
          }}
          disabled={disabled}
          className={`${width} text-center text-[12px] border-2 rounded px-1.5 py-0 h-[24px] focus:outline-none ${disabled ? "border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed" : "border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400"}`}
        />
      )}
    </div>
  );
}

export default function InputPanel({ inputs, onApply }: Props) {
  const [draft, setDraft] = useState<InputValues>(inputs);
  const [showGroundModal, setShowGroundModal] = useState(false);

  useEffect(() => {
    setDraft(inputs);
  }, [inputs]);

  const set = <K extends keyof InputValues>(key: K, value: InputValues[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const isDirty = (Object.keys(draft) as (keyof InputValues)[]).some(key => {
    const a = draft[key];
    const b = inputs[key];
    if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a) !== JSON.stringify(b);
    return a !== b;
  });

  const currentRegion = HUNTING_REGIONS.find(r => r.name === draft.huntingRegion) ?? HUNTING_REGIONS[0];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">필요 정보</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 py-1">
          <label className="text-sm text-gray-400 dark:text-zinc-500 whitespace-nowrap flex-1">물통 시세</label>
          <input
            type="text"
            value=""
            disabled
            className="w-[96px] text-center text-[12px] border-2 border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-400 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>
        <NumInput label="메소마켓 시세" value={draft.mesoMarketRate} onChange={v => set('mesoMarketRate', v)} min={0} max={9999} unit="메포" />
        <div className="flex items-center gap-3 py-1">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">솔 에르다 조각 시세</label>
            <TooltipIcon text={<>• 솔 에르다 조각을 사용할 캐릭터라면 체크박스를 활성화하세요.<br />• 에픽 던전 효율 계산에 사용됩니다.</>} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="relative w-4 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={draft.useSolErda ?? true}
                onChange={e => set('useSolErda', e.target.checked)}
                className="absolute opacity-0 w-0 h-0"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${(draft.useSolErda ?? true) ? 'bg-orange-500 border-orange-500' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}`}>
                {(draft.useSolErda ?? true) && (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </label>
            <NumInput label="" value={draft.priceSolErda ?? 0} onChange={v => set('priceSolErda', v)} min={0} max={9999999} unit="메소" disabled={!(draft.useSolErda ?? true)} />
          </div>
        </div>

        {/* 지역 / 사냥터 선택 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">일 평균 재획</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-700 dark:text-zinc-100 w-[72px] text-center">
                {toTimeStr(draft.dailySessions)}
              </span>
              <button
                onClick={() => set('dailySessions', Math.max(1, draft.dailySessions - 1))}
                className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400 dark:hover:border-orange-400"
              >▼</button>
              <button
                onClick={() => set('dailySessions', Math.min(48, draft.dailySessions + 1))}
                className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400 dark:hover:border-orange-400"
              >▲</button>
            </div>
          </div>
          <div className="flex items-center gap-2 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">사냥터</label>
            <span className="text-[10px] text-gray-400 dark:text-zinc-400 truncate max-w-[164px]">{draft.huntingRegion} · {draft.huntingGround}</span>
            <button
              onClick={() => setShowGroundModal(true)}
              className="px-3 py-0 h-[24px] text-[12px] font-medium rounded border-2 bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              선택
            </button>
          </div>
        </div>

        {showGroundModal && (
          <HuntingGroundModal
            currentRegion={draft.huntingRegion}
            currentGround={draft.huntingGround}
            charLevel={draft.charLevel}
            onConfirm={(region, ground) => {
              setDraft(prev => ({
                ...prev,
                huntingRegion: region,
                huntingGround: ground.name,
                huntingMobs: ground.mobs,
                monsterLevel: ground.mobs[0].level,
                mobCount: ground.mobs.reduce((s, m) => s + m.count, 0),
                boosterMonsterLevel: ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level,
              }));
            }}
            onClose={() => setShowGroundModal(false)}
          />
        )}

        {/* 부스터 사용 횟수 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2 space-y-0.5">
          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold">30분 내 사용 부스터</p>
            <TooltipIcon text={<>부스터를 많이 사용할수록 30분 도핑<br />아이템들의 효율이 상승합니다</>} />
          </div>
          <NumInput label="VIP/HEXA 부스터" value={draft.booster30min} onChange={v => set('booster30min', v)} min={0} max={99} width="w-[44px]" unit="개" />
          <NumInput label="영겁의 황금태엽" value={draft.eternal30min} onChange={v => set('eternal30min', v)} min={0} max={99} width="w-[44px]" unit="개" />
          <div className="flex items-center gap-1 mt-2 mb-1">
            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold">1일 평균 사용 부스터</p>
            <TooltipIcon text={<>부스터를 많이 사용할수록 30일 도핑<br />아이템들의 효율이 상승합니다</>} />
          </div>
          <NumInput label="VIP/HEXA 부스터" value={draft.booster1day} onChange={v => set('booster1day', v)} min={0} max={99} width="w-[44px]" unit="개" />
          <NumInput label="영겁의 황금태엽" value={draft.eternal1day} onChange={v => set('eternal1day', v)} min={0} max={99} width="w-[44px]" unit="개" />
        </div>

        {/* 에픽던전 / 몬스터파크 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">에픽 던전</label>
            <div className="flex gap-1">
              {([
                { val: '하이마운틴', label: '하마', tip: '하이마운틴', minLv: 260 },
                { val: '앵컴',       label: '앵컴', tip: '앵글러컴퍼니', minLv: 270 },
                { val: '악몽선경',   label: '선경', tip: '악몽선경', minLv: 280 },
              ] as const).map(({ val, label, tip, minLv }) => {
                const accessible = draft.charLevel >= minLv;
                return (
                  <TooltipWrapper key={val} tip={tip}>
                    <button
                      onClick={() => accessible && set('epicDungeonZone', val)}
                      disabled={!accessible}
                      className={
                        'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                        (!accessible
                          ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                          : draft.epicDungeonZone === val
                            ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                            : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400 cursor-pointer')
                      }
                    >
                      {label}
                    </button>
                  </TooltipWrapper>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">썬데이 몬파</label>
            <div className="flex gap-1">
              {([
                { val: '평일',   tip: '+0%' },
                { val: '썬데이', tip: '+50%' },
                { val: '스페셜', tip: '+300%' },
              ] as const).map(({ val, tip }) => (
                <TooltipWrapper key={val} tip={tip}>
                  <button
                    onClick={() => set('sunday', val)}
                    className={
                      'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (draft.sunday === val
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')
                    }
                  >
                    {val}
                  </button>
                </TooltipWrapper>
              ))}
            </div>
          </div>
        </div>

        {/* 적용 버튼 */}
        <div className="flex justify-end mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700">
          <button
            onClick={() => onApply(draft)}
            disabled={!isDirty}
            className={`px-4 py-1 text-[12px] font-semibold rounded border-2 transition-colors ${isDirty ? "bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 cursor-pointer" : "bg-gray-200 dark:bg-zinc-700 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed"}`}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
