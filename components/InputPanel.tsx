'use client';

import { InputValues } from '@/types';
import { getExpMultiplier } from '@/lib/calculator';

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string) => void;
}

function NumInput({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <label className="text-xs text-gray-600 whitespace-nowrap">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-28 text-right text-sm border border-yellow-300 bg-yellow-50 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
      />
    </div>
  );
}

export default function InputPanel({ inputs, onChange }: Props) {
  const diff = inputs.charLevel - inputs.monsterLevel;
  const expMult = getExpMultiplier(inputs.charLevel, inputs.monsterLevel);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">필요 정보</h3>
      <NumInput label="메소마켓 시세 (메포당)" value={inputs.mesoMarketRate} onChange={v => onChange('mesoMarketRate', v)} min={1} />
      <NumInput label="캐릭터 레벨" value={inputs.charLevel} onChange={v => onChange('charLevel', v)} min={260} max={299} />
      <NumInput label="몬스터 레벨" value={inputs.monsterLevel} onChange={v => onChange('monsterLevel', v)} min={260} max={299} />
      <NumInput label="하루 소재 횟수" value={inputs.dailySessions} onChange={v => onChange('dailySessions', v)} min={1} />
      <NumInput label="젠당 마릿수" value={inputs.mobCount} onChange={v => onChange('mobCount', v)} min={1} />
      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-1.5">
        {'레벨 차이 '}{diff > 0 ? '+' : ''}{diff}{' → 배율 '}<span className="font-semibold text-blue-600">{(expMult * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
