'use client';

import { useState } from 'react';
import { InputValues, EfficiencyItem } from '@/types';
import { getBase30MinExp, getBase30DayExp, mepoToMeso, getEpicDungeonStage01Exp, getEpicDungeonStage01Price, getEpicDungeonStage12Exp, getEpicDungeonStage12Price, getVipSaunaExp, getVipSaunaPrice, getMekaberryExp, getMonsterParkExp, getEchoExp, getVipEfficiency } from '@/lib/calculator';
import { getMonsterParkZone } from '@/data/monsterPark';

function fmt(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (Math.abs(n) >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  if (Math.abs(n) >= 1e4)  return n.toLocaleString('ko-KR');
  return n.toFixed(0);
}

function fmtMeso(n: number): string {
  if (n <= 0) return '-';
  return Math.round(n).toLocaleString('ko-KR');
}

interface TableRow {
  name: string;
  rate?: number | string;
  exp: number;
  priceMeso: number;
  efficiency: number;
  ratio: number;
  editable?: boolean;
  inputValue?: number;
  onEdit?: (v: number) => void;
  isEvent?: boolean;
}

function PriceInput({ value, onEdit }: { value: number; onEdit: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const display = focused ? String(value) : value.toLocaleString('ko-KR');
  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => {
        const raw = Number(e.target.value.replace(/,/g, ''));
        if (!isNaN(raw)) onEdit(Math.min(raw, 10_000_000_000));
      }}
      className="w-28 border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 text-center text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
    />
  );
}

function EffTable({ title, rows, color = 'green' }: {
  title: string; rows: TableRow[]; color?: 'green' | 'blue' | 'orange';
}) {
  const header: Record<string, string> = {
    green:  'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800',
    blue:   'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800',
    orange: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800',
  };
  const titleColor: Record<string, string> = {
    green:  'text-gray-800 dark:text-zinc-100',
    blue:   'text-gray-800 dark:text-zinc-100',
    orange: 'text-gray-800 dark:text-zinc-100',
  };
  const hasRate = rows.some(r => r.rate !== undefined);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
      <div className={'px-4 py-2.5 border-b ' + header[color]}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor[color]}>{title}</h3>
      </div>
      <table className="table-fixed w-full text-sm border-collapse">
        <colgroup>
          <col style={{width: hasRate ? '160px' : '230px'}} />
          {hasRate && <col style={{width:'70px'}} />}
          <col style={{width:'110px'}} />
          <col style={{width:'160px'}} />
          <col style={{width:'110px'}} />
        </colgroup>
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">항목</th>
            {hasRate && <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">배율</th>}
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">경험치</th>
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">가격(메소)</th>
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">가성비 배율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={"border-b transition-colors " + (row.isEvent ? "bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 border-amber-100 dark:border-amber-800" : "border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700")}>
              <td className="px-2 py-1.5 text-center text-gray-800 dark:text-zinc-200">
                {row.name}
                {row.isEvent && <span className="ml-1.5 text-xs font-medium bg-amber-400 text-white px-1.5 py-0.5 rounded-full">E</span>}
              </td>
              {hasRate && (
                <td className="px-2 py-1.5 text-center text-gray-500 dark:text-zinc-400 text-xs">
                  {row.rate !== undefined && (typeof row.rate === 'string' ? row.rate : '+' + (Number(row.rate) * 100).toFixed(0) + '%')}
                </td>
              )}
              <td className="px-2 py-1.5 text-center text-gray-700 dark:text-zinc-300 whitespace-nowrap">{fmt(row.exp)}</td>
              <td className="px-2 py-1.5 text-center">
                {row.editable && row.onEdit ? (
                  <PriceInput value={row.inputValue ?? 0} onEdit={row.onEdit} />
                ) : (
                  <span className="text-gray-700 dark:text-zinc-300">{fmtMeso(row.priceMeso)}</span>
                )}
              </td>
              <td className="px-2 py-1.5 text-center font-semibold text-orange-500">
                {row.ratio > 0 ? (row.ratio * 100).toFixed(1) + '%' : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InlineInput({ label, value, onChange, min = 0, max = 100 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const [focused, setFocused] = useState(false);
  const display = focused ? String(value) : value.toLocaleString('ko-KR');
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
      {label}
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => {
          const raw = Number(e.target.value.replace(/,/g, ''));
          if (!isNaN(raw)) onChange(Math.min(Math.max(raw, min), max));
        }}
        className="w-12 border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 text-center text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </label>
  );
}

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string) => void;
  items: EfficiencyItem[];
}

function BoosterRateInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false);
  const pct = Math.round(value * 100);
  const display = focused ? String(pct) : pct.toLocaleString('ko-KR');
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
      보약
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => {
          const raw = Number(e.target.value.replace(/,/g, ''));
          if (!isNaN(raw)) onChange(Math.min(Math.max(raw, 0), 100) / 100);
        }}
        className="w-12 border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 text-center text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
      %
    </label>
  );
}

export default function EfficiencyTab({ inputs, onChange }: Props) {
  const vipEff = getVipEfficiency(inputs);
  const base30 = getBase30MinExp(inputs);
  const base30d = getBase30DayExp(inputs);

  const effRow = (exp: number, price: number) => ({
    exp,
    priceMeso: price,
    efficiency: price > 0 ? exp / price : 0,
    ratio: vipEff > 0 && price > 0 ? (exp / price) / vipEff : 0,
  });

  const doping30Rows: TableRow[] = [
    { name: '추가 경험치 50%', rate: 0.5, ...effRow(base30 * 0.5, inputs.price50), editable: true, inputValue: inputs.price50, onEdit: v => onChange('price50', v) },
    { name: '추가 경험치 70%', rate: 0.7, ...effRow(base30 * 0.7, inputs.price70), editable: true, inputValue: inputs.price70, onEdit: v => onChange('price70', v) },
    { name: '2배 쿠폰',                  rate: 1,   ...effRow(base30 * 1,   inputs.price2x), editable: true, inputValue: inputs.price2x, onEdit: v => onChange('price2x', v) },
    { name: '3배 쿠폰',                  rate: 2,   ...effRow(base30 * 2,   inputs.price3x), editable: true, inputValue: inputs.price3x, onEdit: v => onChange('price3x', v) },
    { name: '4배 쿠폰',                  rate: 3,   ...effRow(base30 * 3,   inputs.price4x), editable: true, inputValue: inputs.price4x, onEdit: v => onChange('price4x', v) },
    { name: '소경축비',             rate: 0.1, ...effRow(base30 * 0.1, inputs.priceSmallBooster), editable: true, inputValue: inputs.priceSmallBooster, onEdit: v => onChange('priceSmallBooster', v) },
    { name: '고농축비',             rate: 0.2, ...effRow(base30 * 0.2, inputs.priceLargeBooster), editable: true, inputValue: inputs.priceLargeBooster, onEdit: v => onChange('priceLargeBooster', v) },
    { name: '아즈모스 영약', rate: 0.2, ...effRow(base30 * 0.2, inputs.priceAzmos), editable: true, inputValue: inputs.priceAzmos, onEdit: v => onChange('priceAzmos', v) },
  ];

  const marginRows: TableRow[] = [
    { name: '추가경험치 50%→70%', ...effRow(base30 * 0.2, inputs.price70 - inputs.price50) },
    { name: '소경축비→고농축비', ...effRow(base30 * 0.1, inputs.priceLargeBooster - inputs.priceSmallBooster) },
  ];

  const doping30dRows: TableRow[] = [
    { name: '사냥 칭호',          rate: 1,    ...effRow(base30d * 1,    inputs.priceHunterTitle), editable: true, inputValue: inputs.priceHunterTitle, onEdit: v => onChange('priceHunterTitle', v) },
    { name: '혈맹의 반지(메소)', rate: 0.1, ...effRow(base30d * 0.1, inputs.priceBloodRingMeso), editable: true, inputValue: inputs.priceBloodRingMeso, onEdit: v => onChange('priceBloodRingMeso', v) },
    { name: '부스트링(메소)', rate: 0.15, ...effRow(base30d * 0.15, inputs.priceBoostringMeso), editable: true, inputValue: inputs.priceBoostringMeso, onEdit: v => onChange('priceBoostringMeso', v) },
    { name: '정펜(메소)',          rate: 0.3,  ...effRow(base30d * 0.3,  inputs.priceJungpenMeso), editable: true, inputValue: inputs.priceJungpenMeso, onEdit: v => onChange('priceJungpenMeso', v) },
    { name: '혈맹의 반지(메포)', rate: 0.1, ...effRow(base30d * 0.1,  mepoToMeso(5900,  inputs.mesoMarketRate)) },
    { name: '부스트링(메포)', rate: 0.15, ...effRow(base30d * 0.15, mepoToMeso(29900, inputs.mesoMarketRate)) },
    { name: '정펜(메포)',          rate: 0.3,  ...effRow(base30d * 0.3,  mepoToMeso(49900, inputs.mesoMarketRate)) },
  ];

  const epicName = inputs.epicDungeonZone === '앵컴' ? '앵글러컴퍼니' : inputs.epicDungeonZone;
  const parkZone = getMonsterParkZone(inputs.charLevel);
  const parkExp  = getMonsterParkExp(inputs.charLevel, inputs.sunday, inputs.boosterRate);
  const vipExp   = getVipSaunaExp(inputs.charLevel);
  const mekExp   = getMekaberryExp(inputs.charLevel);
  const echoExp  = getEchoExp(inputs.monsterLevel);

  const bmRows: TableRow[] = [
    { name: epicName + ' 0→1단계', ...effRow(getEpicDungeonStage01Exp(inputs.epicDungeonZone, inputs.charLevel), getEpicDungeonStage01Price(inputs.epicDungeonZone, inputs.mesoMarketRate, (inputs.useSolErda ?? true) ? (inputs.priceSolErda ?? 0) : 0)) },
    { name: epicName + ' 1→2단계', ...effRow(getEpicDungeonStage12Exp(inputs.epicDungeonZone, inputs.charLevel), getEpicDungeonStage12Price(inputs.epicDungeonZone, inputs.mesoMarketRate, (inputs.useSolErda ?? true) ? (inputs.priceSolErda ?? 0) : 0)) },
    { name: '몬스터파크(' + parkZone + ')', ...effRow(parkExp, mepoToMeso(600, inputs.mesoMarketRate)) },
    { name: 'VIP 사우나',            ...effRow(vipExp, getVipSaunaPrice(inputs.mesoMarketRate)) },
  ];

  return (
    <div className="space-y-3 w-[620px]">
      <EffTable title="경험치 도핑 (30분)" rows={doping30Rows} color="green" />

      <div className="flex flex-wrap items-center justify-center gap-6 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg">
        <span className="text-xs font-bold text-gray-600 dark:text-zinc-400">30분 내 사용 부스터</span>
        <div className="flex flex-wrap items-center gap-6">
          <InlineInput label="황금태엽/VIP/헥사" value={inputs.booster30min} onChange={v => onChange('booster30min', v)} min={0} />
          <InlineInput label="영겹의 황금태엽" value={inputs.eternal30min} onChange={v => onChange('eternal30min', v)} min={0} />
        </div>
      </div>

      <EffTable title="상위 아이템 효율" rows={marginRows} color="green" />

      <EffTable title="경험치 도핑 (30일)" rows={doping30dRows} color="blue" />

      <div className="flex flex-wrap items-center justify-center gap-6 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg">
        <span className="text-xs font-bold text-gray-600 dark:text-zinc-400">1일 평균 사용 부스터</span>
        <div className="flex flex-wrap items-center gap-6">
          <InlineInput label="황금태엽/VIP/헥사" value={inputs.booster1day} onChange={v => onChange('booster1day', v)} min={0} />
          <InlineInput label="영겹의 황금태엽" value={inputs.eternal1day} onChange={v => onChange('eternal1day', v)} min={0} />
        </div>
      </div>

      <EffTable title="경험치 BM" rows={bmRows} color="orange" />

      <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg">
        <span className="text-xs font-bold text-gray-600 dark:text-zinc-400">에픽 던전</span>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
          {'지역'}
          <select
            value={inputs.epicDungeonZone}
            onChange={e => onChange('epicDungeonZone', e.target.value)}
            className="border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 text-center text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option className="text-center" value="하이마운틴">하이마운틴</option>
            <option className="text-center" value="앵컴">앵글러컴퍼니</option>
            <option className="text-center" value="악몽선경">악몽선경</option>
          </select>
        </label>
        <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 ml-2">몬스터파크</span>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
          {'썬데이'}
          <select
            value={inputs.sunday}
            onChange={e => onChange('sunday', e.target.value)}
            className="border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-zinc-800 rounded px-1.5 py-0 text-center text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option className="text-center" value="없음">없음</option>
            <option className="text-center" value="기본">기본</option>
            <option className="text-center" value="스페셜">스페셜</option>
          </select>
        </label>
        <BoosterRateInput value={inputs.boosterRate} onChange={v => onChange('boosterRate', v)} />
      </div>
    </div>
  );
}
