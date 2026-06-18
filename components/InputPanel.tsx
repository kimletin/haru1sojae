'use client';

import { useState, useRef, useEffect } from 'react';
import { InputValues, MobGroup } from '@/types';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';
import HuntingGroundModal from '@/components/HuntingGroundModal';

function TooltipIcon({ text }: { text: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: TouchEvent | MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('touchstart', handler);
    document.addEventListener('mousedown', handler);
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  return (
    <div className="relative group" ref={ref}>
      <span
        className="text-xs text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-600 rounded-full w-4 h-4 flex items-center justify-center cursor-default select-none"
        onClick={() => setOpen(v => !v)}
      >?</span>
      <div className={`absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-52 bg-gray-800 text-white text-[11px] rounded-lg px-2.5 py-1.5 transition-opacity pointer-events-none z-50 leading-relaxed shadow-lg ${open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {text}
      </div>
    </div>
  );
}

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string | boolean | MobGroup[]) => void;
}

function SolErdaInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const [focused, setFocused] = useState(false);
  const display = focused ? String(value) : value.toLocaleString('ko-KR');
  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => {
        const raw = Number(e.target.value.replace(/,/g, ''));
        if (!isNaN(raw)) onChange(Math.min(raw, 10_000_000));
      }}
      className={
        'w-[88px] text-center text-[12px] border-2 rounded px-1.5 py-0 h-[24px] focus:outline-none ' +
        (disabled
          ? 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
          : 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400')
      }
    />
  );
}

function NumInput({ label, value, onChange, min, max, width = 'w-[88px]' }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; width?: string;
}) {
  const [focused, setFocused] = useState(false);
  const display = focused ? String(value) : value.toLocaleString('ko-KR');

  return (
    <div className="flex items-center gap-3 py-1">
      <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">{label}</label>
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
            const clamped = min !== undefined && max !== undefined ? Math.min(Math.max(raw, min), max) : raw;
            onChange(clamped);
          }
        }}
        className={`${width} text-center text-[12px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
      />
    </div>
  );
}


export default function InputPanel({ inputs, onChange }: Props) {
  const [showGroundModal, setShowGroundModal] = useState(false);
  const currentRegion = HUNTING_REGIONS.find(r => r.name === inputs.huntingRegion) ?? HUNTING_REGIONS[0];

  const applyGround = (ground: typeof currentRegion.grounds[0]) => {
    onChange('huntingGround', ground.name);
    onChange('huntingMobs', ground.mobs);
    onChange('monsterLevel', ground.mobs[0].level);
    onChange('mobCount', ground.mobs.reduce((s, m) => s + m.count, 0));
    onChange('boosterMonsterLevel', ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level);
  };


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
            className="w-[88px] text-center text-[12px] border-2 border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-400 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>
        <NumInput label="메소마켓 시세" value={inputs.mesoMarketRate} onChange={v => onChange('mesoMarketRate', v)} min={1} />
        <div className="flex items-center gap-3 py-1">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">솔 에르다 조각</label>
            <TooltipIcon text={<>솔 에르다 조각을 사용할 캐릭터라면<br />체크박스를 클릭하세요.<br />교환불가 아이템이므로 사용하지 않을<br />캐릭터는 체크박스를 해제하세요.</>} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="relative w-4 h-4 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={inputs.useSolErda ?? true}
                onChange={e => onChange('useSolErda', e.target.checked as unknown as number)}
                className="absolute opacity-0 w-0 h-0"
              />
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${(inputs.useSolErda ?? true) ? 'bg-orange-500 border-orange-500' : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600'}`}>
                {(inputs.useSolErda ?? true) && (
                  <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </label>
            <SolErdaInput value={inputs.priceSolErda ?? 0} onChange={v => onChange('priceSolErda', v)} disabled={!(inputs.useSolErda ?? true)} />
          </div>
        </div>

        {/* 지역 / 사냥터 선택 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
          <NumInput label="하루 소재 횟수" value={inputs.dailySessions} onChange={v => onChange('dailySessions', v)} min={1} />
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">사냥터</label>
            <button
              onClick={() => setShowGroundModal(true)}
              className="px-3 py-0 h-[24px] text-[12px] font-medium rounded border-2 bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              사냥터 선택
            </button>
          </div>
          <div className="flex justify-end py-0.5">
            <span className="text-xs text-gray-500 dark:text-zinc-400 truncate">{inputs.huntingRegion} · {inputs.huntingGround}</span>
          </div>
        </div>

        {showGroundModal && (
          <HuntingGroundModal
            currentRegion={inputs.huntingRegion}
            currentGround={inputs.huntingGround}
            charLevel={inputs.charLevel}
            onConfirm={(region, ground) => {
              onChange('huntingRegion', region);
              onChange('huntingGround', ground.name);
              onChange('huntingMobs', ground.mobs);
              onChange('monsterLevel', ground.mobs[0].level);
              onChange('mobCount', ground.mobs.reduce((s, m) => s + m.count, 0));
              onChange('boosterMonsterLevel', ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level);
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
          <NumInput label="황금태엽/VIP/헥사" value={inputs.booster30min} onChange={v => onChange('booster30min', v)} min={0} max={99} width="w-[44px]" />
          <NumInput label="영겁의 황금태엽" value={inputs.eternal30min} onChange={v => onChange('eternal30min', v)} min={0} max={99} width="w-[44px]" />
          <div className="flex items-center gap-1 mt-2 mb-1">
            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold">1일 평균 사용 부스터</p>
            <TooltipIcon text={<>부스터를 많이 사용할수록 30일 도핑<br />아이템들의 효율이 상승합니다</>} />
          </div>
          <NumInput label="황금태엽/VIP/헥사" value={inputs.booster1day} onChange={v => onChange('booster1day', v)} min={0} max={99} width="w-[44px]" />
          <NumInput label="영겁의 황금태엽" value={inputs.eternal1day} onChange={v => onChange('eternal1day', v)} min={0} max={99} width="w-[44px]" />
        </div>

        {/* 에픽던전 / 몬스터파크 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">에픽 던전</label>
            <div className="flex gap-1">
              {([
                { val: '하이마운틴', label: '하마', minLv: 260 },
                { val: '앵컴',       label: '앵컴', minLv: 270 },
                { val: '악몽선경',   label: '선경', minLv: 280 },
              ] as const).map(({ val, label, minLv }) => {
                const accessible = inputs.charLevel >= minLv;
                return (
                  <button
                    key={val}
                    onClick={() => accessible && onChange('epicDungeonZone', val)}
                    disabled={!accessible}
                    className={
                      'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors ' +
                      (!accessible
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                        : inputs.epicDungeonZone === val
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400 cursor-pointer')
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">썬데이 몬파</label>
            <div className="flex gap-1">
              {([
                { val: '없음',   label: '평일',   tip: null },
                { val: '기본',   label: '썬데이', tip: '+50%' },
                { val: '스페셜', label: '스페셜', tip: '+300%' },
              ] as const).map(({ val, label, tip }) => (
                <div key={val} className="relative group flex items-center">
                  <button
                    onClick={() => onChange('sunday', val)}
                    className={
                      'px-2 py-0 h-[24px] text-[12px] font-medium rounded border-2 transition-colors cursor-pointer ' +
                      (inputs.sunday === val
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 dark:hover:border-orange-400')
                    }
                  >
                    {label}
                  </button>
                  {tip && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                      {tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
