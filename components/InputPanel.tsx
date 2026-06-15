'use client';

import { useState } from 'react';
import { InputValues } from '@/types';

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string | boolean) => void;
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
        if (!isNaN(raw)) onChange(Math.min(raw, 10_000_000_000));
      }}
      className={
        'w-24 text-center text-sm border-2 rounded px-1.5 py-0 focus:outline-none ' +
        (disabled
          ? 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed'
          : 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400')
      }
    />
  );
}

function NumInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
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
          if (!isNaN(raw)) onChange(raw);
        }}
        className="w-24 text-center text-sm border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}

export default function InputPanel({ inputs, onChange }: Props) {
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
            className="w-24 text-center text-sm border-2 border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 rounded px-1.5 py-0 text-gray-400 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>
        <NumInput label="메소마켓 시세" value={inputs.mesoMarketRate} onChange={v => onChange('mesoMarketRate', v)} min={1} />
        <NumInput label="캐릭터 레벨" value={inputs.charLevel} onChange={v => onChange('charLevel', v)} min={260} max={299} />
        <NumInput label="몬스터 레벨" value={inputs.monsterLevel} onChange={v => onChange('monsterLevel', v)} min={260} max={299} />
        <NumInput label="하루 소재 횟수" value={inputs.dailySessions} onChange={v => onChange('dailySessions', v)} min={1} />
        <NumInput label="젠당 마릿수" value={inputs.mobCount} onChange={v => onChange('mobCount', v)} min={1} />
        <div className="flex items-center gap-3 py-1">
          <div className="flex items-center gap-1 flex-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">솔 에르다 조각</label>
            <div className="relative group">
              <span className="text-xs text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-600 rounded-full w-4 h-4 flex items-center justify-center cursor-default select-none">?</span>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-52 bg-gray-800 dark:bg-zinc-700 text-white text-xs rounded-lg px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                솔 에르다 조각을 사용할 캐릭터라면 체크박스를 클릭하세요.<br />교환불가 아이템이므로 사용하지 않을 캐릭터는 체크박스를 해제하세요.
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={inputs.useSolErda ?? true}
            onChange={e => onChange('useSolErda', e.target.checked as unknown as number)}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <SolErdaInput value={inputs.priceSolErda ?? 0} onChange={v => onChange('priceSolErda', v)} disabled={!(inputs.useSolErda ?? true)} />
        </div>
      </div>
    </div>
  );
}
