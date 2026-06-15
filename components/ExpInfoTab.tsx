'use client';

import { useRef, useState, useEffect } from 'react';
import { LEVEL_EXP } from '@/data/levelExp';
import { getExpMultiplier } from '@/lib/calculator';

const LEVEL_DIFF_TABLE = [
  { range: '40 이상',    mult: 0.70 },
  { range: '39 ~ 21',   mult: null, note: '71 ~ 89%' },
  { range: '20 ~ 19',   mult: 0.95 },
  { range: '18 ~ 17',   mult: 0.96 },
  { range: '16 ~ 15',   mult: 0.97 },
  { range: '14 ~ 13',   mult: 0.98 },
  { range: '12 ~ 11',   mult: 0.99 },
  { range: '10',         mult: 1.00 },
  { range: '9 ~ 5',     mult: 1.05 },
  { range: '4 ~ 2',     mult: 1.10 },
  { range: '1 ~ -1',    mult: 1.20 },
  { range: '-2 ~ -4',   mult: 1.10 },
  { range: '-5 ~ -9',   mult: 1.05 },
  { range: '-10 ~ -20', mult: null, note: '100 ~ 90%' },
  { range: '-21 ~ -35', mult: null, note: '70 ~ 14%' },
  { range: '-36 ~ -39', mult: 0.10 },
  { range: '-40 이하',  mult: 0, note: '최대 100' },
];

function fmtBig(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  return n.toLocaleString('ko-KR');
}

interface Props {
  charLevel: number;
  monsterLevel: number;
}

export default function ExpInfoTab({ charLevel, monsterLevel }: Props) {
  const diff = charLevel - monsterLevel;
  const mult = getExpMultiplier(charLevel, monsterLevel);
  const levels = Object.keys(LEVEL_EXP).map(Number).sort((a, b) => a - b);

  const rightRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const [leftMaxH, setLeftMaxH] = useState<number | null>(null);

  useEffect(() => {
    if (rightRef.current) {
      setLeftMaxH(rightRef.current.offsetHeight);
    }
  }, [charLevel, monsterLevel]);

  useEffect(() => {
    if (activeRowRef.current && leftScrollRef.current) {
      const container = leftScrollRef.current;
      const row = activeRowRef.current;
      const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
      container.scrollTop = offset;
    }
  }, [charLevel, leftMaxH]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '캐릭터 레벨', value: String(charLevel), color: 'text-blue-700' },
          { label: '몬스터 레벨', value: String(monsterLevel), color: 'text-purple-700' },
          { label: '레벨 차이', value: (diff > 0 ? '+' : '') + diff, color: 'text-gray-800 dark:text-gray-200' },
          { label: '경험치 배율', value: (mult * 100).toFixed(0) + '%', color: 'text-green-700' },
        ].map(item => (
          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-4 py-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 text-center">{item.label}</p>
            <p className={'text-2xl font-bold text-center ' + item.color}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col"
          style={leftMaxH ? { maxHeight: leftMaxH } : undefined}
        >
          <div className="bg-blue-50 dark:bg-blue-900/40 border-b border-blue-100 dark:border-blue-800 px-4 py-2.5 shrink-0">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">레벨별 필요 경험치</h3>
          </div>
          <div ref={leftScrollRef} className="overflow-y-auto min-h-0 flex-1">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">레벨</th>
                  <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">필요 경험치</th>
                  <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">증가율</th>
                  <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">누적 비율</th>
                </tr>
              </thead>
              <tbody>
                {levels.map(lv => {
                  const d = LEVEL_EXP[lv];
                  const isMe = lv === charLevel;
                  return (
                    <tr key={lv} ref={isMe ? activeRowRef : undefined} className={'border-b ' + (isMe ? 'bg-blue-50 dark:bg-blue-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700')}>
                      <td className={'px-3 py-1.5 text-center ' + (isMe ? 'text-blue-700' : 'text-gray-700 dark:text-gray-300')}>
                        {lv}
                        {isMe && <span className="ml-1.5 text-xs bg-blue-50 dark:bg-blue-900/40 text-white px-1.5 py-0.5 rounded-full">나</span>}
                      </td>
                      <td className={'px-3 py-1.5 text-center ' + (isMe ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300')}>{fmtBig(d.required)}</td>
                      <td className={'px-3 py-1.5 text-center ' + (isMe ? 'text-blue-800 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400')}>{'+'+(d.increase*100).toFixed(0)+'%'}</td>
                      <td className={'px-3 py-1.5 text-center ' + (isMe ? 'text-blue-800 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400')}>{(d.ratio*100).toFixed(3)+'%'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div ref={rightRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="bg-green-50 dark:bg-green-900/40 border-b border-green-100 dark:border-green-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">레벨 차이별 경험치 배율</h3>
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">캐릭 - 몬스터</th>
                <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">경험치 배율</th>
              </tr>
            </thead>
            <tbody>
              {LEVEL_DIFF_TABLE.map((row, i) => {
                const isActive = row.mult !== null
                  ? Math.abs(getExpMultiplier(charLevel, charLevel - diff) - (row.mult as number)) < 0.001
                  : false;
                return (
                  <tr key={i} className={'border-b ' + (isActive ? 'bg-green-50 dark:bg-green-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700')}>
                    <td className={'px-3 py-2 text-center ' + (isActive ? 'text-green-700' : 'text-gray-700 dark:text-gray-300')}>
                      {row.range}
                      {isActive && <span className="ml-1.5 text-xs bg-green-50 dark:bg-green-900/40 text-white px-1.5 py-0.5 rounded-full">현재</span>}
                    </td>
                    <td className={'px-3 py-2 text-center font-semibold ' + (isActive ? 'text-green-700' : 'text-gray-700 dark:text-gray-300')}>
                      {row.note ?? (row.mult !== null ? (row.mult * 100).toFixed(0) + '%' : '-')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
