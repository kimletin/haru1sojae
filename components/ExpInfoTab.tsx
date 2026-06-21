'use client';

import { LEVEL_EXP } from '@/data/levelExp';
import type { MobGroup } from '@/types';
import Num from '@/components/Num';

interface PenaltyRow {
  label: string;
  value: string;
  note?: string;
  test: (diff: number) => boolean;
}

// 인게임 경험치 패널티 표 그대로 (선형 구간은 범위 한 행 + 비고)
const PENALTY_ROWS: PenaltyRow[] = [
  { label: '40 이상',   value: '0.70배',           test: d => d >= 40 },
  { label: '39 ~ 21',   value: '0.71배 ~ 0.89배',  note: '1레벨 당 0.01씩 증가', test: d => d >= 21 && d <= 39 },
  { label: '20 ~ 19',   value: '0.95배',           test: d => d >= 19 && d <= 20 },
  { label: '18 ~ 17',   value: '0.96배',           test: d => d >= 17 && d <= 18 },
  { label: '16 ~ 15',   value: '0.97배',           test: d => d >= 15 && d <= 16 },
  { label: '14 ~ 13',   value: '0.98배',           test: d => d >= 13 && d <= 14 },
  { label: '12 ~ 11',   value: '0.99배',           test: d => d >= 11 && d <= 12 },
  { label: '10',        value: '1.00배',           test: d => d === 10 },
  { label: '9 ~ 5',     value: '1.05배',           test: d => d >= 5 && d <= 9 },
  { label: '4 ~ 2',     value: '1.10배',           test: d => d >= 2 && d <= 4 },
  { label: '1 ~ -1',    value: '1.20배',           note: '최대 배율', test: d => d >= -1 && d <= 1 },
  { label: '-2 ~ -4',   value: '1.10배',           test: d => d >= -4 && d <= -2 },
  { label: '-5 ~ -9',   value: '1.05배',           test: d => d >= -9 && d <= -5 },
  { label: '-10 ~ -20', value: '1.00배 ~ 0.90배',  note: '1레벨 당 0.01씩 감소', test: d => d >= -20 && d <= -10 },
  { label: '-21 ~ -35', value: '0.70배 ~ 0.14배',  note: '1레벨 당 0.04씩 감소', test: d => d >= -35 && d <= -21 },
  { label: '-36 이하',  value: '0.10배',           test: d => d <= -36 && d >= -39 },
  { label: '-40 이하',  value: '최대 100',              test: d => d <= -40 },
];

interface Props {
  charLevel: number;
  monsterLevel: number;
  huntingMobs?: MobGroup[];
}

export default function ExpInfoTab({ charLevel, monsterLevel, huntingMobs }: Props) {
  const mobs = huntingMobs && huntingMobs.length > 1 ? huntingMobs : null;
  const mobLevels = mobs
    ? mobs.map(m => m.level).filter((v, i, a) => a.indexOf(v) === i)
    : [monsterLevel];

  const levels = Object.keys(LEVEL_EXP).map(Number).sort((a, b) => a - b).filter(lv => lv < 300);

  const isRowActive = (row: PenaltyRow) => mobLevels.some(lv => row.test(charLevel - lv));

  return (
    <div>
      <div className="flex flex-row gap-4 items-start">
        {/* 레벨별 필요 경험치 */}
        <div className="flex-[55] min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">레벨별 필요 경험치</h3>
          </div>
          <table className="table-fixed text-sm border-collapse w-full">
            <colgroup>
              <col style={{width:'25%'}} />
              <col style={{width:'27%'}} />
              <col style={{width:'24%'}} />
              <col style={{width:'24%'}} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">레벨</th>
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">필요 경험치</th>
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">증가율</th>
                <th className="text-center px-5 py-2 text-gray-600 dark:text-zinc-400 font-bold">누적 비율</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(lv => {
                const d = LEVEL_EXP[lv];
                const isMe = lv === charLevel;
                return (
                  <tr key={lv} className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-800')}>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300')}>
                      {lv}
                      {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                    </td>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-700 dark:text-zinc-300')}><Num n={d.required} /></td>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-600 dark:text-zinc-400')}>{'+'+(d.increase*100).toFixed(0)+'%'}</td>
                    <td className={'px-5 py-1.5 text-center ' + (isMe ? 'text-orange-600' : 'text-gray-600 dark:text-zinc-400')}>{(d.ratio*100).toFixed(3)+'%'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 경험치 패널티 */}
        <div className="flex-[45] min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">경험치 패널티</h3>
          </div>
          <table className="table-fixed text-sm border-collapse w-full">
            <colgroup>
              <col style={{width:'30%'}} />
              <col style={{width:'34%'}} />
              <col style={{width:'36%'}} />
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold">캐릭터 - 몬스터</th>
                <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold">경험치 배율</th>
                <th className="text-center px-2 py-2 text-gray-600 dark:text-zinc-400 font-bold">비고</th>
              </tr>
            </thead>
            <tbody>
              {PENALTY_ROWS.map((row, i) => {
                const isActive = isRowActive(row);
                return (
                  <tr
                    key={i}
                    className={'border-b ' + (isActive ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-800')}
                  >
                    <td className={'px-2 py-1.5 text-center whitespace-nowrap ' + (isActive ? 'text-orange-400' : 'text-gray-700 dark:text-zinc-300')}>
                      {row.label}
                      {isActive && <span className="ml-1 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                    </td>
                    <td className={'px-2 py-1.5 text-center whitespace-nowrap font-semibold ' + (isActive ? 'text-orange-400' : 'text-gray-700 dark:text-zinc-300')}>
                      {row.value}
                    </td>
                    <td className="px-2 py-1.5 text-center text-xs text-gray-400 dark:text-zinc-500 leading-tight">
                      {row.note ?? ''}
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
