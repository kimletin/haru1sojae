'use client';

import { InputValues, EfficiencyItem } from '@/types';
import { getBase30MinExp, getBase30DayExp, mepoToMeso, getEpicDungeonStage01Exp, getEpicDungeonStage01Price, getEpicDungeonStage12Exp, getEpicDungeonStage12Price, getVipSaunaExp, getVipSaunaPrice, getMonsterParkExp, getVipEfficiency } from '@/lib/calculator';
import { getMonsterParkZone } from '@/data/monsterPark';
import Num from '@/components/Num';

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

function EffTable({ title, rows, color = 'green', headerExtra }: {
  title: string; rows: TableRow[]; color?: 'green' | 'blue' | 'orange'; headerExtra?: React.ReactNode;
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
      <div className={'px-4 py-2.5 border-b relative ' + header[color]}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor[color]}>{title}</h3>
        {headerExtra && <div className="absolute right-3 top-1/2 -translate-y-1/2">{headerExtra}</div>}
      </div>
      <table className="table-fixed w-full text-sm border-collapse">
        <colgroup>
          <col style={{width: hasRate ? '150px' : '200px'}} />
          {hasRate && <col style={{width:'60px'}} />}
          <col style={{width:'100px'}} />
          <col style={{width:'140px'}} />
          <col style={{width:'110px'}} />
        </colgroup>
        <thead>
          <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">항목</th>
            {hasRate && <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">배율</th>}
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">경험치</th>
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">가격(메소)</th>
            <th className="text-center px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold">가성비 배율</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ height: 36 }} className={"border-b transition-colors " + (row.isEvent ? "bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 border-amber-100 dark:border-amber-800" : "border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700")}>
              <td className="px-2 py-1.5 text-center text-gray-800 dark:text-zinc-200">
                <span className="inline-flex items-center justify-center gap-0.5 flex-wrap">
                  <ItemName name={row.name} />
                  {row.isEvent && <span className="text-xs font-medium bg-amber-400 text-white px-1.5 py-0.5 rounded-full">E</span>}
                </span>
              </td>
              {hasRate && (
                <td className="px-2 py-1.5 text-center text-gray-500 dark:text-zinc-400 text-xs">
                  {row.rate !== undefined && (typeof row.rate === 'string' ? row.rate : '+' + (Number(row.rate) * 100).toFixed(0) + '%')}
                </td>
              )}
              <td className="px-2 py-1.5 text-center text-gray-700 dark:text-zinc-300 whitespace-nowrap"><Num n={row.exp} /></td>
              <td className="px-2 py-1.5 text-center">
                <span className="text-gray-700 dark:text-zinc-300">{fmtMeso(row.priceMeso)}</span>
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

import type { MobGroup } from '@/types';
import ItemName from '@/components/ItemName';

interface Props {
  inputs: InputValues;
  onChange: (key: keyof InputValues, value: number | string | boolean | MobGroup[]) => void;
  items: EfficiencyItem[];
  monsterParkBonus?: number;
}

export default function EfficiencyTab({ inputs, monsterParkBonus = 0 }: Props) {
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
    { name: '추경 50%', rate: 0.5, ...effRow(base30 * 0.5, inputs.price50) },
    { name: '추경 50%→70%', rate: 0.2, ...effRow(base30 * 0.2, inputs.price70 - inputs.price50) },
    { name: '2배 쿠폰',                  rate: 1,   ...effRow(base30 * 1,   inputs.price2x) },
    { name: '3배 쿠폰',                  rate: 2,   ...effRow(base30 * 2,   inputs.price3x) },
    { name: '4배 쿠폰',                  rate: 3,   ...effRow(base30 * 3,   inputs.price4x) },
    { name: '소경축비',             rate: 0.1, ...effRow(base30 * 0.1, inputs.priceSmallBooster) },
    { name: '소경축비→고농축비', rate: 0.1, ...effRow(base30 * 0.1, inputs.priceLargeBooster - inputs.priceSmallBooster) },
    { name: '아즈모스 영약', rate: 0.2, ...effRow(base30 * 0.2, inputs.priceAzmos) },
  ];

  const doping30dRows: TableRow[] = [
    { name: '사냥 칭호',          rate: 1,    ...effRow(base30d * 1,    inputs.priceHunterTitle) },
    { name: '혈맹의 반지(메소)', rate: 0.1, ...effRow(base30d * 0.1, inputs.priceBloodRingMeso) },
    { name: '혈맹의 반지(메포)', rate: 0.1, ...effRow(base30d * 0.1,  mepoToMeso(5900,  inputs.mesoMarketRate)) },
    { name: '경험치 부스트링(메소)', rate: 0.15, ...effRow(base30d * 0.15, inputs.priceBoostringMeso) },
    { name: '경험치 부스트링(메포)', rate: 0.15, ...effRow(base30d * 0.15, mepoToMeso(29900, inputs.mesoMarketRate)) },
    { name: '정령의 펜던트(메소)',          rate: 0.3,  ...effRow(base30d * 0.3,  inputs.priceJungpenMeso) },
    { name: '정령의 펜던트(메포)',          rate: 0.3,  ...effRow(base30d * 0.3,  mepoToMeso(49900, inputs.mesoMarketRate)) },
  ];

  const epicName = inputs.epicDungeonZone === '앵컴' ? '앵글러컴퍼니' : inputs.epicDungeonZone;
  const parkZone = getMonsterParkZone(inputs.charLevel);
  const parkExp  = getMonsterParkExp(inputs.charLevel, inputs.sunday, monsterParkBonus);
  const vipExp   = getVipSaunaExp(inputs.charLevel);

  const bmRows: TableRow[] = [
    { name: epicName + ' 0→1단계', ...effRow(getEpicDungeonStage01Exp(inputs.epicDungeonZone, inputs.charLevel), getEpicDungeonStage01Price(inputs.epicDungeonZone, inputs.mesoMarketRate)) },
    { name: epicName + ' 1→2단계', ...effRow(getEpicDungeonStage12Exp(inputs.epicDungeonZone, inputs.charLevel), getEpicDungeonStage12Price(inputs.epicDungeonZone, inputs.mesoMarketRate)) },
    { name: '몬스터파크(' + parkZone + ')', ...effRow(parkExp, mepoToMeso(600, inputs.mesoMarketRate)) },
    { name: 'VIP 사우나',            ...effRow(vipExp, getVipSaunaPrice(inputs.mesoMarketRate)) },
  ];

  return (
    <div className="space-y-4 w-[560px]">
      <EffTable title="경험치 도핑 (30분)" rows={doping30Rows} color="green" />

      <EffTable
        title="경험치 도핑 (30일)"
        rows={doping30dRows}
        color="blue"
      />

      <EffTable title="경험치 BM" rows={bmRows} color="orange" />
    </div>
  );
}
