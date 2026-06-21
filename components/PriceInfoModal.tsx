'use client';

import { useState, useEffect } from 'react';
import { InputValues } from '@/types';

interface Props {
  values: InputValues;
  onApply: (patch: Partial<InputValues>) => void;
  onClose: () => void;
}

// 모달에서 편집하는 시세 필드
type PriceFields = Pick<InputValues,
  | 'mesoMarketRate'
  | 'price50' | 'price70' | 'price2x' | 'price3x' | 'price4x'
  | 'priceSmallBooster' | 'priceLargeBooster' | 'priceAzmos'
  | 'priceHunterTitle' | 'priceBloodRingMeso' | 'priceBoostringMeso' | 'priceJungpenMeso'
>;

function Field({ label, value, onChange, unit = '메소', max = 9_999_999_999, disabled }: {
  label: string; value?: number; onChange?: (v: number) => void; unit?: string; max?: number; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const display = disabled ? '' : focused ? String(value) : (value ?? 0).toLocaleString('ko-KR');
  return (
    <div className="flex items-center gap-3 py-1">
      <label className={`text-sm whitespace-nowrap flex-1 ${disabled ? 'text-gray-400 dark:text-zinc-500' : 'text-gray-700 dark:text-zinc-300'}`}>{label}</label>
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
            if (!isNaN(raw)) onChange?.(Math.min(Math.max(raw, 0), max));
          }}
          className={`w-[128px] text-center text-[12px] border-2 rounded px-1.5 ${unit ? 'pr-7' : ''} py-0 h-[24px] focus:outline-none ${disabled ? 'border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 cursor-not-allowed' : 'border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-yellow-400'}`}
        />
        {unit && <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">{unit}</span>}
      </div>
    </div>
  );
}

export default function PriceInfoModal({ values, onApply, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const [local, setLocal] = useState<PriceFields>({
    mesoMarketRate: values.mesoMarketRate,
    price50: values.price50,
    price70: values.price70,
    price2x: values.price2x,
    price3x: values.price3x,
    price4x: values.price4x,
    priceSmallBooster: values.priceSmallBooster,
    priceLargeBooster: values.priceLargeBooster,
    priceAzmos: values.priceAzmos,
    priceHunterTitle: values.priceHunterTitle,
    priceBloodRingMeso: values.priceBloodRingMeso,
    priceBoostringMeso: values.priceBoostringMeso,
    priceJungpenMeso: values.priceJungpenMeso,
  });

  const upd = <K extends keyof PriceFields>(key: K, value: PriceFields[K]) =>
    setLocal(prev => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-[320px] max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-700 shrink-0">
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">시세 정보 입력</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
          >×</button>
        </div>

        {/* 바디 */}
        <div className="px-5 py-3 overflow-y-auto">
          <Field label="물통 시세" disabled unit="" />
          <Field label="메소마켓 시세" value={local.mesoMarketRate} onChange={v => upd('mesoMarketRate', v)} unit="메포" max={9999} />

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold mb-1">경험치 도핑 (30분)</p>
            <Field label="추가 경험치 50%" value={local.price50} onChange={v => upd('price50', v)} />
            <Field label="추가 경험치 70%" value={local.price70} onChange={v => upd('price70', v)} />
            <Field label="2배 쿠폰" value={local.price2x} onChange={v => upd('price2x', v)} />
            <Field label="3배 쿠폰" value={local.price3x} onChange={v => upd('price3x', v)} />
            <Field label="4배 쿠폰" value={local.price4x} onChange={v => upd('price4x', v)} />
            <Field label="소경축비" value={local.priceSmallBooster} onChange={v => upd('priceSmallBooster', v)} />
            <Field label="고농축비" value={local.priceLargeBooster} onChange={v => upd('priceLargeBooster', v)} />
            <Field label="아즈모스 영약" value={local.priceAzmos} onChange={v => upd('priceAzmos', v)} />
          </div>

          <div className="border-t border-gray-100 dark:border-zinc-700 mt-2 pt-2">
            <p className="text-xs text-orange-500 dark:text-orange-400 font-bold mb-1">경험치 도핑 (30일)</p>
            <Field label="사냥 칭호" value={local.priceHunterTitle} onChange={v => upd('priceHunterTitle', v)} />
            <Field label="혈맹의 반지" value={local.priceBloodRingMeso} onChange={v => upd('priceBloodRingMeso', v)} />
            <Field label="경험치 부스트링" value={local.priceBoostringMeso} onChange={v => upd('priceBoostringMeso', v)} />
            <Field label="정령의 펜던트" value={local.priceJungpenMeso} onChange={v => upd('priceJungpenMeso', v)} />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end px-5 py-3 border-t border-gray-100 dark:border-zinc-700 shrink-0">
          <button
            onClick={handleApply}
            className="px-4 py-1 text-[12px] font-semibold rounded border-2 bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 transition-colors cursor-pointer"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
