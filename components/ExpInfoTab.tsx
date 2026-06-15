'use client';

import { LEVEL_EXP } from '@/data/levelExp';
import { getExpMultiplier } from '@/lib/calculator';

const LEVEL_DIFF_TABLE = [
  { range: '40 이상',   mult: 0.70 },
  { range: '39 ~ 21',  mult: null, note: '71 ~ 89%' },
  { range: '20 ~ 19',  mult: 0.95 },
  { range: '18 ~ 17',  mult: 0.96 },
  { range: '16 ~ 15',  mult: 0.97 },
  { range: '14 ~ 13',  mult: 0.98 },
  { range: '12 ~ 11',  mult: 0.99 },
  { range: '10',        mult: 1.00 },
  { range: '9 ~ 5',    mult: 1.05 },
  { range: '4 ~ 2',    mult: 1.10 },
  { range: '1 ~ -1',   mult: 1.20 },
  { range: '-2 ~ -4',  mult: 1.10 },
  { range: '-5 ~ -9',  mult: 1.05 },
  { range: '-10 ~ -20',mult: null, note: '100 ~ 90%' },
  { range: '-21 ~ -35',mult: null, note: '70 ~ 14%' },
  { range: '-36 ~ -39',mult: 0.10 },
  { range: '-40 이하', mult: 0, note: '최대 100배' },
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

  return (
    <div className="space-y-6">
      {/* 현재 설정 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-500">캐릭터 레벨</span><br /><strong className="text-lg">{charLevel}</strong></div>
        <div><span className="text-gray-500">몬스터 레벨</span><br /><strong className="text-lg">{monsterLevel}</strong></div>
        <div><span className="text-gray-500">레벨 차이</span><br /><strong className="text-lg">{diff > 0 ? '+' : ''}{diff}</strong></div>
        <div><span className="text-gray-500">경험치 배율</span><br /><strong className="text-lg text-blue-600">{(mult * 100).toFixed(0)}%</strong></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 레벨별 필요 경험치 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">레벨</th>
                <th className="text-right px-3 py-2">필요 경험치</th>
                <th className="text-right px-3 py-2">증가율</th>
                <th className="text-right px-3 py-2">누적 비율</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(lv => {
                const d = LEVEL_EXP[lv];
                const isCurrentChar = lv === charLevel;
                return (
                  <tr key={lv} className={`border-b ${isCurrentChar ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-1.5">{lv}{isCurrentChar && <span className="ml-1 text-xs text-yellow-600">▶</span>}</td>
                    <td className="px-3 py-1.5 text-right">{fmtBig(d.required)}</td>
                    <td className="px-3 py-1.5 text-right">{d.increase >= 1 ? `+${(d.increase * 100).toFixed(0)}%` : `+${(d.increase * 100).toFixed(0)}%`}</td>
                    <td className="px-3 py-1.5 text-right">{(d.ratio * 100).toFixed(3)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 레벨 차이별 경험치 배율 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">캐릭 - 몬스터</th>
                <th className="text-right px-3 py-2">경험치 배율</th>
              </tr>
            </thead>
            <tbody>
              {LEVEL_DIFF_TABLE.map((row, i) => {
                // 현재 diff가 이 범위에 해당하는지 하이라이트
                const isActive = row.mult !== null
                  ? (() => {
                      const m = getExpMultiplier(charLevel, charLevel - diff);
                      return Math.abs(m - (row.mult as number)) < 0.001;
                    })()
                  : false;
                return (
                  <tr key={i} className={`border-b ${isActive ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-1.5">{row.range}{isActive && <span className="ml-1 text-xs text-yellow-600">◀ 현재</span>}</td>
                    <td className="px-3 py-1.5 text-right">
                      {row.note ?? (row.mult !== null ? `${(row.mult * 100).toFixed(0)}%` : '-')}
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
