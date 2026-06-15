'use client';

import { useState } from 'react';
import { InputValues } from '@/types';

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string) => void;
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
      <div className="bg-orange-100 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">필요 정보</h3>
      </div>
      <div className="p-4">
        <NumInput label="메소마켓 시세" value={inputs.mesoMarketRate} onChange={v => onChange('mesoMarketRate', v)} min={1} />
        <NumInput label="캐릭터 레벨" value={inputs.charLevel} onChange={v => onChange('charLevel', v)} min={260} max={299} />
        <NumInput label="몬스터 레벨" value={inputs.monsterLevel} onChange={v => onChange('monsterLevel', v)} min={260} max={299} />
        <NumInput label="하루 소재 횟수" value={inputs.dailySessions} onChange={v => onChange('dailySessions', v)} min={1} />
        <NumInput label="젠당 마릿수" value={inputs.mobCount} onChange={v => onChange('mobCount', v)} min={1} />
      </div>
    </div>
  );
}
