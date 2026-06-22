'use client';

import { useState } from 'react';
import type { InputValues } from '@/types';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';
import type { HuntingGround, HuntingRegion } from '@/data/huntingGrounds';
import { MONSTER_PARK_ZONES } from '@/data/monsterPark';
import TooltipWrapper from '@/components/TooltipWrapper';

interface Props {
  charName: string;
  initialInputs: InputValues;
  onSubmit: (inputs: InputValues) => void;
  onBack?: () => void;             // 있을 때만 "뒤로" 표시
  submitLabel?: string;           // 제출 버튼 라벨 (기본 '추가')
  disableIfUnchanged?: boolean;   // 변경 없으면 제출 버튼 비활성화
}

function toTimeStr(sessions: number): string {
  return `${sessions / 2}시간`;
}

function regionMinLevel(region: HuntingRegion): number {
  return Math.min(...region.grounds.flatMap(g => g.mobs.map(m => m.level)));
}

function regionLevelRange(region: HuntingRegion): string {
  const levels = region.grounds.flatMap(g => g.mobs.map(m => m.level));
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  return min === max ? `${min}` : `${min}-${max}`;
}

function mobLevelLabel(mobs: { level: number; count: number }[]): string {
  const levels = [...new Set(mobs.map(m => m.level))];
  return levels.length === 1 ? `Lv.${levels[0]}` : levels.map(l => `Lv.${l}`).join('/');
}

// 숫자 입력 (라벨 + 단위)
function NumField({ label, value, onChange, unit = '메소', max = 9_999_999_999, min = 0, disabled, width = 'w-[118px]' }: {
  label: string; value?: number; onChange?: (v: number) => void; unit?: string; max?: number; min?: number; disabled?: boolean; width?: string;
}) {
  const [focused, setFocused] = useState(false);
  const display = disabled ? '' : focused ? String(value) : (value ?? 0).toLocaleString('ko-KR');
  return (
    <div className="flex items-center gap-2 py-0.5">
      <label className={`text-xs whitespace-nowrap flex-1 ${disabled ? 'text-gray-400 dark:text-zinc-500' : 'text-gray-700 dark:text-zinc-300'}`}>{label}</label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="numeric"
          value={display}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={e => {
            const raw = Number(e.target.value.replace(/,/g, ''));
            if (!isNaN(raw)) onChange?.(Math.min(Math.max(raw, min), max));
          }}
          className={`${width} text-center text-[11px] border-2 rounded px-1.5 ${unit ? 'pr-6' : ''} py-0 h-[24px] focus:outline-none ${disabled ? 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed' : 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400'}`}
        />
        {unit && <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}

const sectionLabel = 'text-xs text-orange-500 dark:text-orange-400 font-bold mb-1';

function TooltipIcon({ text }: { text: React.ReactNode }) {
  return (
    <TooltipWrapper tip={text} tipClassName="!whitespace-normal w-52 leading-relaxed">
      <span className="text-[10px] text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-600 rounded-full w-4 h-4 flex items-center justify-center cursor-default select-none shrink-0">?</span>
    </TooltipWrapper>
  );
}

export default function CharacterInfoStep({ charName, initialInputs, onSubmit, onBack, submitLabel = '추가', disableIfUnchanged = false }: Props) {
  const [d, setD] = useState<InputValues>(initialInputs);
  const set = <K extends keyof InputValues>(key: K, value: InputValues[K]) =>
    setD(prev => ({ ...prev, [key]: value }));

  const unchanged = disableIfUnchanged && JSON.stringify(d) === JSON.stringify(initialInputs);

  const selectGround = (region: string, ground: HuntingGround) => {
    setD(prev => ({
      ...prev,
      huntingRegion: region,
      huntingGround: ground.name,
      huntingMobs: ground.mobs,
      monsterLevel: ground.mobs[0].level,
      mobCount: ground.mobs.reduce((s, m) => s + m.count, 0),
      boosterMonsterLevel: ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level,
    }));
  };

  const currentRegion = HUNTING_REGIONS.find(r => r.name === d.huntingRegion) ?? HUNTING_REGIONS[0];

  return (
    <div className="flex flex-col">
      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
        <span className="font-bold text-gray-800 dark:text-zinc-200">{charName}</span> 님의 정보를 입력하세요
      </p>

      <div className="grid grid-cols-3 gap-4">
        {/* 1열: 시세 정보 */}
        <div className="min-w-0">
          <p className={sectionLabel}>시세 정보</p>
          <NumField label="물통 시세" disabled unit="" />
          <NumField label="메소마켓 시세" value={d.mesoMarketRate} onChange={v => set('mesoMarketRate', v)} unit="메포" max={9999} />
          <div className="border-t border-gray-100 dark:border-zinc-700 mt-1.5 pt-1.5">
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-0.5">30분 도핑</p>
            <NumField label="추가 경험치 50%" value={d.price50} onChange={v => set('price50', v)} />
            <NumField label="추가 경험치 70%" value={d.price70} onChange={v => set('price70', v)} />
            <NumField label="2배 쿠폰" value={d.price2x} onChange={v => set('price2x', v)} />
            <NumField label="3배 쿠폰" value={d.price3x} onChange={v => set('price3x', v)} />
            <NumField label="4배 쿠폰" value={d.price4x} onChange={v => set('price4x', v)} />
            <NumField label="소경축비" value={d.priceSmallBooster} onChange={v => set('priceSmallBooster', v)} />
            <NumField label="고농축비" value={d.priceLargeBooster} onChange={v => set('priceLargeBooster', v)} />
            <NumField label="아즈모스 영약" value={d.priceAzmos} onChange={v => set('priceAzmos', v)} />
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-700 mt-1.5 pt-1.5">
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-semibold mb-0.5">30일 도핑</p>
            <NumField label="부티크 사냥 칭호" value={d.priceHunterTitle} onChange={v => set('priceHunterTitle', v)} />
            <NumField label="혈맹의 반지" value={d.priceBloodRingMeso} onChange={v => set('priceBloodRingMeso', v)} />
            <NumField label="경험치 부스트링" value={d.priceBoostringMeso} onChange={v => set('priceBoostringMeso', v)} />
            <NumField label="정령의 펜던트" value={d.priceJungpenMeso} onChange={v => set('priceJungpenMeso', v)} />
          </div>
        </div>

        {/* 2열: 사냥(일 평균 재획) + 부스터 + 에픽 던전 + 몬스터파크 */}
        <div className="min-w-0 border-l border-gray-100 dark:border-zinc-700 pl-4">
          <p className={sectionLabel}>사냥</p>
          <div className="flex items-center gap-2 py-0.5">
            <label className="text-xs whitespace-nowrap flex-1 text-gray-700 dark:text-zinc-300">일 평균 재획</label>
            <div className="flex items-center gap-0.5">
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-100">{toTimeStr(d.dailySessions)}</span>
              <button
                onClick={() => set('dailySessions', Math.min(48, d.dailySessions + 1))}
                className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400"
              >▲</button>
              <button
                onClick={() => set('dailySessions', Math.max(1, d.dailySessions - 1))}
                className="w-5 h-5 flex items-center justify-center text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400"
              >▼</button>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-1 pt-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-orange-500 dark:text-orange-400 font-bold">30분 내 사용 부스터</span>
              <TooltipIcon text={<>부스터를 많이 사용할수록 30분 도핑<br />아이템들의 효율이 상승합니다</>} />
            </div>
            <NumField label="VIP/HEXA 부스터" value={d.booster30min} onChange={v => set('booster30min', v)} unit="개" max={99} width="w-[60px]" />
            <NumField label="영겁의 황금태엽" value={d.eternal30min} onChange={v => set('eternal30min', v)} unit="개" max={99} width="w-[60px]" />
            <div className="flex items-center gap-1 mt-2 mb-1">
              <span className="text-xs text-orange-500 dark:text-orange-400 font-bold">1일 평균 사용 부스터</span>
              <TooltipIcon text={<>부스터를 많이 사용할수록 30일 도핑<br />아이템들의 효율이 상승합니다</>} />
            </div>
            <NumField label="VIP/HEXA 부스터" value={d.booster1day} onChange={v => set('booster1day', v)} unit="개" max={99} width="w-[60px]" />
            <NumField label="영겁의 황금태엽" value={d.eternal1day} onChange={v => set('eternal1day', v)} unit="개" max={99} width="w-[60px]" />
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <p className={sectionLabel}>에픽 던전</p>
            <div className="flex gap-1">
              {([
                { val: '하이마운틴', label: '하이마운틴', minLv: 260 },
                { val: '앵글러컴퍼니', label: '앵글러컴퍼니', minLv: 270 },
                { val: '악몽선경',   label: '악몽선경', minLv: 280 },
              ] as const).map(({ val, label, minLv }) => {
                const accessible = d.charLevel >= minLv;
                return (
                  <button
                    key={val}
                    onClick={() => accessible && set('epicDungeonZone', val)}
                    disabled={!accessible}
                    className={
                      'flex-1 py-1.5 flex flex-col items-center justify-center rounded border-2 text-[10px] transition-colors ' +
                      (!accessible
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                        : d.epicDungeonZone === val
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 cursor-pointer')
                    }
                  >
                    <span className="font-medium leading-tight text-center px-0.5">{label}</span>
                    <span className={'text-[9px] mt-0.5 ' + (d.epicDungeonZone === val ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>Lv.{minLv}-</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <p className={sectionLabel}>몬스터파크</p>
            <div className="grid grid-cols-3 gap-1">
              {MONSTER_PARK_ZONES.map(({ zone, minLevel }) => {
                const accessible = d.charLevel >= minLevel;
                const active = d.monsterParkZone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => accessible && set('monsterParkZone', zone)}
                    disabled={!accessible}
                    className={
                      'py-1.5 flex flex-col items-center justify-center rounded border-2 text-[10px] transition-colors ' +
                      (!accessible
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                        : active
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 cursor-pointer')
                    }
                  >
                    <span className="font-medium leading-tight text-center px-0.5">{zone}</span>
                    <span className={'text-[9px] mt-0.5 ' + (active ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>Lv.{minLevel}-</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3열: 사냥터 (높이는 1열 기준, 목록만 스크롤) */}
        <div className="relative min-w-0 border-l border-gray-100 dark:border-zinc-700">
          <div className="absolute inset-0 flex flex-col pl-4">
            <p className={sectionLabel}>사냥터</p>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {HUNTING_REGIONS.map(r => {
                const locked = d.charLevel < regionMinLevel(r);
                const active = r.name === d.huntingRegion;
                return (
                  <button
                    key={r.name}
                    disabled={locked}
                    onClick={() => { if (!locked && r.grounds.length > 0) selectGround(r.name, r.grounds[0]); }}
                    className={
                      'w-full py-1.5 flex flex-col items-center justify-center rounded border-2 transition-colors ' +
                      (locked
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-400'
                        : active
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-300 hover:border-orange-400 cursor-pointer')
                    }
                  >
                    <span className="text-[10px] font-medium leading-tight text-center px-0.5">{r.name}</span>
                    <span className={'text-[9px] mt-0.5 ' + (active ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>Lv.{regionLevelRange(r)}</span>
                  </button>
                );
              })}
            </div>
            <div className="border border-gray-200 dark:border-zinc-700 rounded flex-1 min-h-0 overflow-y-auto">
              {currentRegion.grounds.map(g => {
                const active = g.name === d.huntingGround;
                return (
                  <button
                    key={g.name}
                    onClick={() => selectGround(currentRegion.name, g)}
                    className={
                      'w-full text-left px-2 py-1 flex items-center justify-between gap-1 transition-colors cursor-pointer ' +
                      (active ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800')
                    }
                  >
                    <span className="text-[11px] truncate">{g.name}</span>
                    <span className={'text-[10px] shrink-0 ' + (active ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
                      {mobLevelLabel(g.mobs)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className={'flex mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700 ' + (onBack ? 'justify-between' : 'justify-end')}>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-1 text-[12px] font-semibold rounded border-2 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-300 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors cursor-pointer"
          >뒤로</button>
        )}
        <button
          onClick={() => onSubmit(d)}
          disabled={unchanged}
          className={'px-5 py-1 text-[12px] font-semibold rounded border-2 transition-colors ' + (unchanged ? 'bg-gray-200 dark:bg-zinc-700 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed' : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 cursor-pointer')}
        >{submitLabel}</button>
      </div>
    </div>
  );
}
