'use client';

import { useEffect, useRef, useState } from 'react';
import type { InputValues } from '@/types';
import { HUNTING_REGIONS } from '@/data/huntingGrounds';
import type { HuntingGround, HuntingRegion } from '@/data/huntingGrounds';
import { MONSTER_PARK_ZONES } from '@/data/monsterPark';
import TooltipWrapper from '@/components/ui/TooltipWrapper';

interface Props {
  charName: string;
  initialInputs: InputValues;
  onSubmit: (inputs: InputValues) => void;
  onBack?: () => void;             // 있을 때만 "뒤로" 표시
  submitLabel?: string;           // 제출 버튼 라벨 (기본 '추가')
  disableIfUnchanged?: boolean;   // 변경 없으면 제출 버튼 비활성화
  loadSources?: { name: string; inputs: InputValues }[]; // "불러오기"로 시세·가격 복사할 다른 캐릭터 목록
}

// 초기화/불러오기가 건드리는 1열(시세+도핑 가격) 필드
const PRICE_KEYS = [
  'waterBottleRate', 'mesoMarketRate',
  'price50', 'price70', 'price2x', 'price3x', 'price4x',
  'priceSmallBooster', 'priceLargeBooster',
  'priceHunterTitle', 'priceBloodRingMeso', 'priceBoostringMeso', 'priceJungpenMeso',
] as const;

function toTimeStr(sessions: number): string {
  return `${sessions / 2}시간`;
}

function regionMinLevel(region: HuntingRegion): number {
  return Math.min(...region.grounds.flatMap(g => g.mobs.map(m => m.level)));
}

function mobLevelLabel(mobs: { level: number; count: number }[]): string {
  const levels = [...new Set(mobs.map(m => m.level))];
  return levels.length === 1 ? `Lv.${levels[0]}` : levels.map(l => `Lv.${l}`).join('/');
}

// 숫자 입력 (라벨 + 단위)
function NumField({ label, value, onChange, unit = '메소', max = 9_999_999_999, min = 0, disabled, width = 'w-[130px] lg:w-[120px]', icon }: {
  label: string; value?: number; onChange?: (v: number) => void; unit?: string; max?: number; min?: number; disabled?: boolean; width?: string; icon?: string;
}) {
  const [focused, setFocused] = useState(false);
  // 값이 0(미입력)이면 빈칸으로 표시(placeholder "0"). 포커스 중엔 콤마 없이 원본, 벗어나면 콤마로 구분. 키보드 닫힘은 감지하지 않음.
  const display = disabled || !value ? '' : focused ? String(value) : value.toLocaleString('ko-KR');

  return (
    <div className="flex items-center gap-2 py-0.5">
      {icon && <img src={`/icons/${encodeURIComponent(icon)}.png`} alt="" className={`w-5 h-5 shrink-0 object-contain ${disabled ? 'opacity-40' : ''}`} />}
      <label className={`text-[13px] lg:text-xs whitespace-nowrap flex-1 ${disabled ? 'text-gray-400 dark:text-zinc-500' : 'text-gray-700 dark:text-zinc-300'}`}>{label}</label>
      {/* 모바일: 입력창 실제 font-size는 16px(확대 방지), scale로 시각적으로만 12px처럼 보이게 축소. 데스크톱(lg)은 원래 11px 그대로 */}
      <div className={`relative ${width} h-[24px] overflow-visible`}>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          placeholder={disabled ? '' : '0'}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          onChange={e => {
            const raw = Number(e.target.value.replace(/[^0-9]/g, ''));
            if (!isNaN(raw)) onChange?.(Math.min(Math.max(raw, min), max));
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 w-[calc(100%/0.75)] h-[calc(100%/0.75)] text-[16px] border-[2.6667px] rounded-[5.3333px] px-[8px] ${unit ? 'pr-[32px]' : ''} lg:static lg:translate-x-0 lg:translate-y-0 lg:scale-100 lg:w-full lg:h-full lg:text-[11px] lg:border-2 lg:rounded lg:px-1.5 ${unit ? 'lg:pr-6' : ''} text-center py-0 focus:outline-none ${disabled ? 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed' : 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400'}`}
        />
        {unit && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs lg:text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}

// 개수 입력 (라벨 + ▲▼ 버튼, 일 평균 재획과 동일한 형태)
function StepperField({ label, icon, value, onChange, min = 0, max = 99, unit = '개' }: {
  label: string; icon?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  const stepBtn = 'w-6 h-6 lg:w-5 lg:h-5 flex items-center justify-center text-xs lg:text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400';
  return (
    <div className="flex items-center gap-2 py-0.5">
      {icon && <img src={`/icons/${encodeURIComponent(icon)}.png`} alt="" className="w-6 h-6 lg:w-5 lg:h-5 shrink-0 object-contain" />}
      <label className="text-[13px] lg:text-xs whitespace-nowrap flex-1 text-gray-700 dark:text-zinc-300">{label}</label>
      <div className="flex items-center gap-0.5">
        <span className="text-[13px] lg:text-xs font-semibold text-gray-700 dark:text-zinc-100">{value}{unit}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className={stepBtn}>▲</button>
        <button onClick={() => onChange(Math.max(min, value - 1))} className={stepBtn}>▼</button>
      </div>
    </div>
  );
}

const sectionLabel = 'text-xs text-orange-500 dark:text-orange-400 font-bold mb-1';

function TooltipIcon({ text }: { text: React.ReactNode }) {
  return (
    <TooltipWrapper tip={text} tipClassName="w-52">
      <span className="text-[10px] text-gray-400 dark:text-zinc-500 border border-gray-300 dark:border-zinc-600 rounded-full w-4 h-4 flex items-center justify-center cursor-default select-none shrink-0">?</span>
    </TooltipWrapper>
  );
}

export default function CharacterInfoStep({ charName, initialInputs, onSubmit, onBack, submitLabel = '추가', disableIfUnchanged = false, loadSources = [] }: Props) {
  const [d, setD] = useState<InputValues>(initialInputs);
  const [showLoad, setShowLoad] = useState(false);
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

  // 초기화: 모든 입력란 0(빈칸), 사냥시간·부스터 0, 던전/파크/사냥터 첫 항목으로
  const handleReset = () => {
    const firstRegion = HUNTING_REGIONS[0];
    const firstGround = firstRegion.grounds[0];
    setD(prev => ({
      ...prev,
      waterBottleRate: 0, mesoMarketRate: 0,
      price50: 0, price70: 0, price2x: 0, price3x: 0, price4x: 0,
      priceSmallBooster: 0, priceLargeBooster: 0,
      priceHunterTitle: 0, priceBloodRingMeso: 0, priceBoostringMeso: 0, priceJungpenMeso: 0,
      dailySessions: 0,
      booster30min: 0, eternal30min: 0, booster1day: 0, eternal1day: 0,
      epicDungeonZone: '하이마운틴',
      monsterParkZone: MONSTER_PARK_ZONES[0].zone,
      huntingRegion: firstRegion.name,
      huntingGround: firstGround.name,
      huntingMobs: firstGround.mobs,
      monsterLevel: firstGround.mobs[0].level,
      mobCount: firstGround.mobs.reduce((s, m) => s + m.count, 0),
      boosterMonsterLevel: firstGround.boosterLevel ?? firstGround.mobs[firstGround.mobs.length - 1].level,
    }));
  };

  // 불러오기: 선택한 캐릭터의 1열(시세+도핑 가격) 값만 복사
  const handleLoad = (src: InputValues) => {
    setD(prev => {
      const next = { ...prev };
      for (const k of PRICE_KEYS) next[k] = src[k];
      return next;
    });
    setShowLoad(false);
  };

  const currentRegion = HUNTING_REGIONS.find(r => r.name === d.huntingRegion) ?? HUNTING_REGIONS[0];

  // 모달 최초 오픈 시에만 선택된 사냥터로 자동 스크롤 (이후 클릭으로 선택 바뀌어도 재실행 안 함 — 의존성 배열 비움)
  // 컨테이너 내부에서만 스크롤 위치를 계산해 적용 — 네이티브 scrollIntoView는 모달 자체의 스크롤까지 건드려서 사용하지 않음
  const activeGroundRef = useRef<HTMLButtonElement>(null);
  const groundScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame2 = 0;
    const frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        const btn = activeGroundRef.current;
        const container = groundScrollRef.current;
        if (!btn || !container) return;
        const btnRect = btn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offset = btnRect.top - containerRect.top + container.scrollTop - container.clientHeight / 2 + btn.clientHeight / 2;
        container.scrollTop = Math.max(0, offset);
      });
    });
    return () => { cancelAnimationFrame(frame1); cancelAnimationFrame(frame2); };
  }, []);

  return (
    <div className="flex flex-col">
      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
        <span className="font-bold text-gray-800 dark:text-zinc-200">{charName}</span> 님의 정보를 입력하세요
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-2">
        {/* 1열: 시세 정보 */}
        <div className="min-w-0">
          <p className={sectionLabel}>시세 정보</p>
          <NumField label="물통 시세" value={d.waterBottleRate} onChange={v => set('waterBottleRate', v)} unit="원" max={9999} icon="메소" />
          <NumField label="메소마켓 시세" value={d.mesoMarketRate} onChange={v => set('mesoMarketRate', v)} unit="메포" max={9999} icon="메포" />
          <div className="border-t border-gray-100 dark:border-zinc-700 mt-1.5 pt-1.5">
            <p className="text-[11px] text-orange-500 dark:text-orange-400 font-semibold mb-0.5">30분 도핑</p>
            <NumField label="추가 경험치 50%" value={d.price50} onChange={v => set('price50', v)} icon="추가 경험치 50%" />
            <NumField label="추가 경험치 70%" value={d.price70} onChange={v => set('price70', v)} icon="추가 경험치 70%" />
            <NumField label="경험치 2배 쿠폰" value={d.price2x} onChange={v => set('price2x', v)} icon="경험치 2배 쿠폰" />
            <NumField label="경험치 3배 쿠폰" value={d.price3x} onChange={v => set('price3x', v)} icon="경험치 3배 쿠폰" />
            <NumField label="경험치 4배 쿠폰" value={d.price4x} onChange={v => set('price4x', v)} icon="경험치 4배 쿠폰" />
            <NumField label="소경축비" value={d.priceSmallBooster} onChange={v => set('priceSmallBooster', v)} icon="소경축비" />
            <NumField label="고농축비" value={d.priceLargeBooster} onChange={v => set('priceLargeBooster', v)} icon="고농축비" />
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-700 mt-1.5 pt-1.5">
            <p className="text-[11px] text-orange-500 dark:text-orange-400 font-semibold mb-0.5">30일 도핑</p>
            <NumField label="부티크 사냥 칭호" value={d.priceHunterTitle} onChange={v => set('priceHunterTitle', v)} icon="부티크 사냥 칭호" />
            <NumField label="혈맹의 반지" value={d.priceBloodRingMeso} onChange={v => set('priceBloodRingMeso', v)} icon="혈맹의 반지" />
            <NumField label="경험치 부스트링" value={d.priceBoostringMeso} onChange={v => set('priceBoostringMeso', v)} icon="경험치 부스트링" />
            <NumField label="정령의 펜던트" value={d.priceJungpenMeso} onChange={v => set('priceJungpenMeso', v)} icon="정령의 펜던트" />
          </div>
        </div>

        {/* 2열: 사냥(일 평균 재획) + 부스터 + 에픽 던전 + 몬스터파크 */}
        <div className="min-w-0 pt-2 border-t border-gray-100 dark:border-zinc-700 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-4">
          <p className={sectionLabel}>사냥 시간</p>
          <div className="flex items-center gap-2 py-0.5">
            <img src={`/icons/${encodeURIComponent('소재비')}.png`} alt="" className="w-6 h-6 lg:w-5 lg:h-5 shrink-0 object-contain" />
            <label className="text-[13px] lg:text-xs whitespace-nowrap flex-1 text-gray-700 dark:text-zinc-300">일 평균 재획</label>
            <div className="flex items-center gap-0.5">
              <span className="text-[13px] lg:text-xs font-semibold text-gray-700 dark:text-zinc-100">{toTimeStr(d.dailySessions)}</span>
              <button
                onClick={() => set('dailySessions', Math.min(48, d.dailySessions + 1))}
                className="w-6 h-6 lg:w-5 lg:h-5 flex items-center justify-center text-xs lg:text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400"
              >▲</button>
              <button
                onClick={() => set('dailySessions', Math.max(1, d.dailySessions - 1))}
                className="w-6 h-6 lg:w-5 lg:h-5 flex items-center justify-center text-xs lg:text-[10px] text-gray-500 dark:text-zinc-400 hover:text-orange-500 cursor-pointer border border-gray-300 dark:border-zinc-600 rounded hover:border-orange-400"
              >▼</button>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-orange-500 dark:text-orange-400 font-bold">30분 내 사용 부스터</span>
              <TooltipIcon text={<>부스터를 많이 사용할수록 30분 도핑<br />아이템들의 효율이 상승합니다</>} />
            </div>
            <StepperField label="VIP/HEXA 부스터" icon="VIP 부스터" value={d.booster30min} onChange={v => set('booster30min', v)} />
            <StepperField label="영겁의 황금태엽" icon="영겁의 황금태엽" value={d.eternal30min} onChange={v => set('eternal30min', v)} />
            <div className="flex items-center gap-1 mt-2 mb-1">
              <span className="text-xs text-orange-500 dark:text-orange-400 font-bold">1일 평균 사용 부스터</span>
              <TooltipIcon text={<>부스터를 많이 사용할수록 30일 도핑<br />아이템들의 효율이 상승합니다</>} />
            </div>
            <StepperField label="VIP/HEXA 부스터" icon="VIP 부스터" value={d.booster1day} onChange={v => set('booster1day', v)} />
            <StepperField label="영겁의 황금태엽" icon="영겁의 황금태엽" value={d.eternal1day} onChange={v => set('eternal1day', v)} />
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <p className={sectionLabel}>에픽 던전</p>
            <div className="grid grid-cols-3 gap-1">
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
                      'h-14 p-0.5 flex flex-col items-center justify-center gap-0.5 rounded border-2 text-[10px] lg:text-[9px] transition-colors ' +
                      (!accessible
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                        : d.epicDungeonZone === val
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 cursor-pointer')
                    }
                  >
                    <img src={`/icons/${encodeURIComponent(val)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
                    <span className="font-medium leading-tight text-center px-0.5">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <p className={sectionLabel}>몬스터파크</p>
            <div className="grid grid-cols-4 gap-1">
              {MONSTER_PARK_ZONES.map(({ zone, minLevel }) => {
                const accessible = d.charLevel >= minLevel;
                const active = d.monsterParkZone === zone;
                return (
                  <button
                    key={zone}
                    onClick={() => accessible && set('monsterParkZone', zone)}
                    disabled={!accessible}
                    className={
                      'h-14 p-0.5 flex flex-col items-center justify-center gap-0.5 rounded border-2 text-[10px] lg:text-[9px] transition-colors ' +
                      (!accessible
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400'
                        : active
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-400 hover:border-orange-400 cursor-pointer')
                    }
                  >
                    <img src={`/icons/${encodeURIComponent(zone)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
                    <span className="font-medium leading-tight text-center px-0.5">{zone}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3열: 사냥터 (데스크톱은 1열 기준 높이 맞춤, 목록만 스크롤 / 모바일은 자연 높이) */}
        <div className="relative min-w-0 pt-2 border-t border-gray-100 dark:border-zinc-700 lg:pt-0 lg:border-t-0 lg:border-l">
          <div className="flex flex-col lg:absolute lg:inset-0 lg:pl-4">
            <p className={sectionLabel}>사냥터</p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {HUNTING_REGIONS.map(r => {
                const locked = d.charLevel < regionMinLevel(r);
                const active = r.name === d.huntingRegion;
                return (
                  <button
                    key={r.name}
                    disabled={locked}
                    onClick={() => { if (!locked && r.grounds.length > 0) selectGround(r.name, r.grounds[0]); }}
                    className={
                      'w-full h-14 p-0.5 flex flex-col items-center justify-center gap-0.5 rounded border-2 transition-colors ' +
                      (locked
                        ? 'opacity-40 cursor-not-allowed bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-400'
                        : active
                          ? 'bg-orange-500 border-orange-500 text-white cursor-pointer'
                          : 'bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-300 hover:border-orange-400 cursor-pointer')
                    }
                  >
                    <img src={`/icons/${encodeURIComponent(r.name)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
                    <span className="text-[10px] lg:text-[9px] font-medium leading-tight text-center px-0.5">{r.name}</span>
                  </button>
                );
              })}
            </div>
            <div ref={groundScrollRef} className="border border-gray-200 dark:border-zinc-700 rounded max-h-[240px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto">
              {currentRegion.grounds.map(g => {
                const active = g.name === d.huntingGround;
                return (
                  <button
                    key={g.name}
                    ref={active ? activeGroundRef : undefined}
                    onClick={() => selectGround(currentRegion.name, g)}
                    className={
                      'w-full text-left px-2 py-1 flex items-center justify-between gap-1 transition-colors cursor-pointer ' +
                      (active ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800')
                    }
                  >
                    <span className="text-[13px] lg:text-[11px] truncate">{g.name}</span>
                    <span className={'text-xs lg:text-[10px] shrink-0 ' + (active ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>
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
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-1 text-[12px] font-semibold rounded border-2 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-300 hover:border-gray-400 dark:hover:border-zinc-500 transition-colors cursor-pointer"
            >뒤로</button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loadSources.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowLoad(v => !v)}
                className="px-3 py-1 text-[12px] font-semibold rounded border-2 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-300 hover:border-orange-400 transition-colors cursor-pointer"
              >불러오기</button>
              {showLoad && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLoad(false)} />
                  <div className="absolute bottom-full mb-1 right-0 z-20 min-w-[120px] max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded-lg shadow-lg py-1">
                    {loadSources.map(s => (
                      <button
                        key={s.name}
                        onClick={() => handleLoad(s.inputs)}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-gray-700 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer truncate"
                      >{s.name}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-1 text-[12px] font-semibold rounded border-2 border-gray-300 dark:border-zinc-600 text-gray-600 dark:text-zinc-300 hover:border-orange-400 transition-colors cursor-pointer"
          >초기화</button>
          <button
            onClick={() => onSubmit(d)}
            disabled={unchanged}
            className={'px-5 py-1 text-[12px] font-semibold rounded border-2 transition-colors ' + (unchanged ? 'bg-gray-200 dark:bg-zinc-700 border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed' : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 cursor-pointer')}
          >{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}
