'use client';

import { InputValues, EfficiencyItem } from '@/types';
import { getBase30MinExp, getBase30DayExp, mepoToMeso, getEpicDungeonStage01Exp, getEpicDungeonStage01Price, getEpicDungeonStage12Exp, getEpicDungeonStage12Price, getVipSaunaExp, getVipSaunaPrice, getMekaberryExp, getMonsterParkExp, getEchoExp, getVipEfficiency } from '@/lib/calculator';
import { getMonsterParkZone } from '@/data/monsterPark';

function fmt(n: number): string {
  if (n === 0) return '0';
  if (Math.abs(n) >= 1e12) return (n / 1e12).toFixed(2) + '\uc870';
  if (Math.abs(n) >= 1e8)  return (n / 1e8).toFixed(2) + '\uc5b5';
  if (Math.abs(n) >= 1e4)  return n.toLocaleString('ko-KR');
  return n.toFixed(0);
}

function fmtMeso(n: number): string {
  if (n <= 0) return '-';
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '\uc5b5';
  return n.toLocaleString('ko-KR');
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
}

function EffTable({ title, rows, color = 'green' }: {
  title: string; rows: TableRow[]; color?: 'green' | 'blue' | 'orange';
}) {
  const header: Record<string, string> = {
    green:  'bg-green-50 border-green-200',
    blue:   'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className={header[color] + ' border-b'}>
            <th className="text-left px-3 py-2 font-semibold text-gray-700" colSpan={2}>{title}</th>
            <th className="text-right px-3 py-2 font-medium text-gray-500">\uacbd\ud5d8\uce58</th>
            <th className="text-right px-3 py-2 font-medium text-gray-500">\uac00\uaca9(\uba54\uc18c)</th>
            <th className="text-right px-3 py-2 font-medium text-gray-500">\uac00\uc131\ube44</th>
            <th className="text-right px-3 py-2 font-medium text-gray-500">\ubc30\uc728</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 text-gray-800">{row.name}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">
                {row.rate !== undefined && (typeof row.rate === 'string' ? row.rate : '+' + (Number(row.rate) * 100).toFixed(0) + '%')}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">{fmt(row.exp)}</td>
              <td className="px-3 py-2 text-right">
                {row.editable && row.onEdit ? (
                  <input
                    type="number"
                    value={row.inputValue}
                    onChange={e => row.onEdit!(Number(e.target.value))}
                    className="w-28 text-right border border-yellow-300 bg-yellow-50 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                ) : (
                  <span className="text-gray-700">{fmtMeso(row.priceMeso)}</span>
                )}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">{row.efficiency > 0 ? row.efficiency.toFixed(2) : '-'}</td>
              <td className={'px-3 py-2 text-right font-semibold ' + (row.ratio >= 1 ? 'text-blue-600' : 'text-gray-500')}>
                {row.ratio > 0 ? row.ratio.toFixed(4) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InlineInput({ label, value, onChange, min, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; step?: number;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-gray-600">
      {label}
      <input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="w-14 text-right border border-yellow-300 bg-yellow-50 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-yellow-400"
      />
    </label>
  );
}

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string) => void;
  items: EfficiencyItem[];
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
    { name: '\ucd94\uac00 \uacbd\ud5d8\uce58 50%', rate: 0.5, ...effRow(base30 * 0.5, inputs.price50), editable: true, inputValue: inputs.price50, onEdit: v => onChange('price50', v) },
    { name: '\ucd94\uac00 \uacbd\ud5d8\uce58 70%', rate: 0.7, ...effRow(base30 * 0.7, inputs.price70), editable: true, inputValue: inputs.price70, onEdit: v => onChange('price70', v) },
    { name: '2\ubc30 \ucfe0\ud3f0',                  rate: 1,   ...effRow(base30 * 1,   inputs.price2x), editable: true, inputValue: inputs.price2x, onEdit: v => onChange('price2x', v) },
    { name: '3\ubc30 \ucfe0\ud3f0',                  rate: 2,   ...effRow(base30 * 2,   inputs.price3x), editable: true, inputValue: inputs.price3x, onEdit: v => onChange('price3x', v) },
    { name: '4\ubc30 \ucfe0\ud3f0',                  rate: 3,   ...effRow(base30 * 3,   inputs.price4x), editable: true, inputValue: inputs.price4x, onEdit: v => onChange('price4x', v) },
    { name: '\uc18c\uacbd\ucd95\ube44',             rate: 0.1, ...effRow(base30 * 0.1, inputs.priceSmallBooster), editable: true, inputValue: inputs.priceSmallBooster, onEdit: v => onChange('priceSmallBooster', v) },
    { name: '\uace0\ub18d\ucd95\ube44',             rate: 0.2, ...effRow(base30 * 0.2, inputs.priceLargeBooster), editable: true, inputValue: inputs.priceLargeBooster, onEdit: v => onChange('priceLargeBooster', v) },
    { name: '\uc544\uc988\ubaa8\uc2a4 \uc601\uc57d', rate: 0.2, ...effRow(base30 * 0.2, inputs.priceAzmos), editable: true, inputValue: inputs.priceAzmos, onEdit: v => onChange('priceAzmos', v) },
  ];

  const marginRows: TableRow[] = [
    { name: '\ucd94\uac00\uacbd\ud5d8\uce58 50%\u217070%', rate: '(\ub9c8\uc9c4)', ...effRow(base30 * 0.2, inputs.price70 - inputs.price50) },
    { name: '\uc18c\uacbd\ucd95\ube44\u2192\uace0\ub18d\ucd95\ube44', rate: '(\ub9c8\uc9c4)', ...effRow(base30 * 0.1, inputs.priceLargeBooster - inputs.priceSmallBooster) },
  ];

  const doping30dRows: TableRow[] = [
    { name: '\uc0ac\ub0e5 \uce6d\ud638',          rate: 1,    ...effRow(base30d * 1,    inputs.priceHunterTitle), editable: true, inputValue: inputs.priceHunterTitle, onEdit: v => onChange('priceHunterTitle', v) },
    { name: '\ud601\ub9f9\uc758 \ubc18\uc9c0(\uba54\uc18c)', rate: 0.1, ...effRow(base30d * 0.1, inputs.priceBloodRingMeso), editable: true, inputValue: inputs.priceBloodRingMeso, onEdit: v => onChange('priceBloodRingMeso', v) },
    { name: '\ubd80\uc2a4\ud2b8\ub9c1(\uba54\uc18c)', rate: 0.15, ...effRow(base30d * 0.15, inputs.priceBoostringMeso), editable: true, inputValue: inputs.priceBoostringMeso, onEdit: v => onChange('priceBoostringMeso', v) },
    { name: '\uc815\ud39c(\uba54\uc18c)',          rate: 0.3,  ...effRow(base30d * 0.3,  inputs.priceJungpenMeso), editable: true, inputValue: inputs.priceJungpenMeso, onEdit: v => onChange('priceJungpenMeso', v) },
    { name: '\ud601\ub9f9\uc758 \ubc18\uc9c0(\uba54\ud3ec)', rate: 0.1, ...effRow(base30d * 0.1,  mepoToMeso(5900,  inputs.mesoMarketRate)) },
    { name: '\ubd80\uc2a4\ud2b8\ub9c1(\uba54\ud3ec)', rate: 0.15, ...effRow(base30d * 0.15, mepoToMeso(29900, inputs.mesoMarketRate)) },
    { name: '\uc815\ud39c(\uba54\ud3ec)',          rate: 0.3,  ...effRow(base30d * 0.3,  mepoToMeso(49900, inputs.mesoMarketRate)) },
  ];

  const epicName = inputs.epicDungeonZone === '\uc575\ucef4' ? '\uc575\uae00\ub7ec\ucef4\ud37c\ub2c8' : inputs.epicDungeonZone;
  const parkZone = getMonsterParkZone(inputs.charLevel);
  const parkExp  = getMonsterParkExp(inputs.charLevel, inputs.sunday, inputs.boosterRate);
  const vipExp   = getVipSaunaExp(inputs.charLevel);
  const mekExp   = getMekaberryExp(inputs.charLevel);
  const echoExp  = getEchoExp(inputs.monsterLevel);

  const bmRows: TableRow[] = [
    { name: epicName + ' 0\u21921\ub2e8\uacc4', ...effRow(getEpicDungeonStage01Exp(inputs.epicDungeonZone, inputs.charLevel), getEpicDungeonStage01Price(inputs.epicDungeonZone, inputs.mesoMarketRate)) },
    { name: epicName + ' 1\u21922\ub2e8\uacc4', ...effRow(getEpicDungeonStage12Exp(inputs.epicDungeonZone, inputs.charLevel), getEpicDungeonStage12Price(inputs.epicDungeonZone, inputs.mesoMarketRate)) },
    { name: '\ubaac\uc2a4\ud130\ud30c\ud06c(' + parkZone + ')', ...effRow(parkExp, mepoToMeso(600, inputs.mesoMarketRate)) },
    { name: 'VIP \uc0ac\uc6b0\ub098',            ...effRow(vipExp, getVipSaunaPrice(inputs.mesoMarketRate)) },
    ...(mekExp > 0 ? [{ name: '\uba54\uce74\ubca0\ub9ac \ub18d\uc7a5 \uc785\uc7a5\uad8c', ...effRow(mekExp, mepoToMeso(10000, inputs.mesoMarketRate)) }] : []),
    { name: '\uc545\ubab9\uc758 \uba54\uc544\ub9ac', ...effRow(echoExp, inputs.priceEcho), editable: true, inputValue: inputs.priceEcho, onEdit: v => onChange('priceEcho', v) },
  ];

  return (
    <div className="space-y-3">
      <EffTable title="\uacbd\ud5d8\uce58 \ub3c4\ud551 (30\ubd84)" rows={doping30Rows} color="green" />

      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
        <span className="text-xs font-medium text-gray-500">30\ubd84 \ub0b4 \uc0ac\uc6a9 \ubd80\uc2a4\ud130</span>
        <InlineInput label="\ud669\uae08\ud0dc\uc5fd/VIP/\ud5e5\uc0ac" value={inputs.booster30min} onChange={v => onChange('booster30min', v)} min={0} />
        <InlineInput label="\uc601\uaca81\uc758 \ud669\uae08\ud0dc\uc5fd" value={inputs.eternal30min} onChange={v => onChange('eternal30min', v)} min={0} />
      </div>

      <EffTable title="\ub9c8\uc9c4 \ube44\uad50" rows={marginRows} color="green" />

      <EffTable title="\uacbd\ud5d8\uce58 \ub3c4\ud551 (30\uc77c)" rows={doping30dRows} color="blue" />

      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
        <span className="text-xs font-medium text-gray-500">1\uc77c \ud3c9\uade0 \uc0ac\uc6a9 \ubd80\uc2a4\ud130</span>
        <InlineInput label="\ud669\uae08\ud0dc\uc5fd/VIP/\ud5e5\uc0ac" value={inputs.booster1day} onChange={v => onChange('booster1day', v)} min={0} />
        <InlineInput label="\uc601\uaca81\uc758 \ud669\uae08\ud0dc\uc5fd" value={inputs.eternal1day} onChange={v => onChange('eternal1day', v)} min={0} />
      </div>

      <EffTable title="\uacbd\ud5d8\uce58 BM" rows={bmRows} color="orange" />

      <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
        <span className="text-xs font-medium text-gray-500">\uc5d0\ud53d \ub358\uc804</span>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          {'\uc9c0\uc5ed'}
          <select
            value={inputs.epicDungeonZone}
            onChange={e => onChange('epicDungeonZone', e.target.value)}
            className="border border-yellow-300 bg-yellow-50 rounded px-1 py-0.5 text-xs focus:outline-none"
          >
            <option value="\ud558\uc774\ub9c8\uc6b4\ud150">\ud558\uc774\ub9c8\uc6b4\ud150</option>
            <option value="\uc575\ucef4">\uc575\uae00\ub7ec\ucef4\ud37c\ub2c8</option>
            <option value="\uc545\ubab9\uc120\uacbd">\uc545\ubab9\uc120\uacbd</option>
          </select>
        </label>
        <span className="text-xs font-medium text-gray-500">\ubaac\uc2a4\ud130\ud30c\ud06c</span>
        <label className="flex items-center gap-1.5 text-xs text-gray-600">
          {'\uc36c\ub370\uc774'}
          <select
            value={inputs.sunday}
            onChange={e => onChange('sunday', e.target.value)}
            className="border border-yellow-300 bg-yellow-50 rounded px-1 py-0.5 text-xs focus:outline-none"
          >
            <option value="\uc5c6\uc74c">\uc5c6\uc74c</option>
            <option value="\uae30\ubcf8">\uae30\ubcf8</option>
            <option value="\uc2a4\ud398\uc15c">\uc2a4\ud398\uc15c</option>
          </select>
        </label>
        <InlineInput label="\ubcf4\uc57d" value={inputs.boosterRate} onChange={v => onChange('boosterRate', v)} min={0} step={0.1} />
      </div>
    </div>
  );
}
