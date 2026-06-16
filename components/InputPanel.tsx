'use client';

import { useState } from 'react';
import { InputValues, MobGroup } from '@/types';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';

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
        'w-[88px] text-center text-[13px] border-2 rounded px-1.5 py-0 h-[24px] focus:outline-none ' +
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
        className={`${width} text-center text-[13px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400`}
      />
    </div>
  );
}

function BoosterRateRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const pct = Math.round(value * 100);
  const display = focused ? String(pct) : pct + '%';
  return (
    <div className="flex items-center gap-3 py-1">
      <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">보약</label>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={e => { setFocused(true); e.target.select(); }}
        onBlur={() => setFocused(false)}
        onChange={e => {
          const raw = Number(e.target.value.replace('%', ''));
          if (!isNaN(raw)) onChange(Math.min(Math.max(raw, 0), 100) / 100);
        }}
        style={{ textAlign: 'center' }}
        className="w-[64px] text-[13px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
}

export default function InputPanel({ inputs, onChange }: Props) {
  const currentRegion = HUNTING_REGIONS.find(r => r.name === inputs.huntingRegion) ?? HUNTING_REGIONS[0];

  const applyGround = (ground: typeof currentRegion.grounds[0]) => {
    onChange('huntingGround', ground.name);
    onChange('huntingMobs', ground.mobs);
    onChange('monsterLevel', ground.mobs[0].level);
    onChange('mobCount', ground.mobs.reduce((s, m) => s + m.count, 0));
    onChange('boosterMonsterLevel', ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level);
  };

  const handleRegionChange = (regionName: string) => {
    const region = HUNTING_REGIONS.find(r => r.name === regionName)!;
    onChange('huntingRegion', regionName);
    applyGround(region.grounds[0]);
  };

  const handleGroundChange = (groundName: string) => {
    const ground = currentRegion.grounds.find(g => g.name === groundName)!;
    applyGround(ground);
  };

  const selectCls = 'text-[13px] border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer';

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
            className="w-[88px] text-center text-[13px] border-2 border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 rounded px-1.5 py-0 h-[24px] text-gray-400 dark:text-zinc-500 cursor-not-allowed"
          />
        </div>
        <NumInput label="메소마켓 시세" value={inputs.mesoMarketRate} onChange={v => onChange('mesoMarketRate', v)} min={1} />
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

        {/* 지역 / 사냥터 선택 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
          <NumInput label="하루 소재 횟수" value={inputs.dailySessions} onChange={v => onChange('dailySessions', v)} min={1} />
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">지역</label>
            <select
              value={inputs.huntingRegion}
              onChange={e => handleRegionChange(e.target.value)}
              className={selectCls + ' w-[88px]'}
            >
              {HUNTING_REGIONS.map(r => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">사냥터</label>
            <select
              value={inputs.huntingGround}
              onChange={e => handleGroundChange(e.target.value)}
              className={selectCls + ' w-[184px]'}
            >
              {currentRegion.grounds.map(g => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 부스터 사용 횟수 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2 space-y-0.5">
          <p className="text-xs text-orange-500 dark:text-orange-400 font-bold mb-1">30분 내 사용 부스터</p>
          <NumInput label="황금태엽/VIP/헥사" value={inputs.booster30min} onChange={v => onChange('booster30min', v)} min={0} max={99} width="w-[44px]" />
          <NumInput label="영겁의 황금태엽" value={inputs.eternal30min} onChange={v => onChange('eternal30min', v)} min={0} max={99} width="w-[44px]" />
          <p className="text-xs text-orange-500 dark:text-orange-400 font-bold mt-2 mb-1">1일 평균 사용 부스터</p>
          <NumInput label="황금태엽/VIP/헥사" value={inputs.booster1day} onChange={v => onChange('booster1day', v)} min={0} max={99} width="w-[44px]" />
          <NumInput label="영겁의 황금태엽" value={inputs.eternal1day} onChange={v => onChange('eternal1day', v)} min={0} max={99} width="w-[44px]" />
        </div>

        {/* 에픽던전 / 몬스터파크 */}
        <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">에픽던전 지역</label>
            <select
              value={inputs.epicDungeonZone}
              onChange={e => onChange('epicDungeonZone', e.target.value)}
              className={selectCls + ' w-[108px]'}
            >
              <option value="하이마운틴">하이마운틴</option>
              <option value="앵컴">앵글러컴퍼니</option>
              <option value="악몽선경">악몽선경</option>
            </select>
          </div>
          <div className="flex items-center gap-3 py-1">
            <label className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap flex-1">몬파 썬데이</label>
            <select
              value={inputs.sunday}
              onChange={e => onChange('sunday', e.target.value)}
              className={selectCls + ' w-[108px]'}
            >
              <option value="없음">평일</option>
              <option value="기본">썬데이 (+50%)</option>
              <option value="스페셜">스페셜 (+250%)</option>
            </select>
          </div>
          <BoosterRateRow value={inputs.boosterRate} onChange={v => onChange('boosterRate', v)} />
        </div>
      </div>
    </div>
  );
}
