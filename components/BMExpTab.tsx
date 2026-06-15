'use client';

import { useRef, useEffect } from 'react';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { EXPRESS_BOOSTER_EXP } from '@/data/expressBooster';
import { LEVEL_EXP } from '@/data/levelExp';

const LEVELS = Array.from({ length: 40 }, (_, i) => i + 260);

function fmt(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  if (n >= 1e4)  return n.toLocaleString('ko-KR');
  return n.toFixed(0);
}

function pct(exp: number, level: number) {
  const req = LEVEL_EXP[level]?.required;
  if (!req) return '';
  return '+' + ((exp / req) * 100).toFixed(2) + '%';
}

interface SectionTableProps {
  title: string;
  headerColor: string;
  titleColor: string;
  rows: { level: number; value: number; isMe: boolean; badgeColor: string; textColor: string; rowBg: string }[];
  levelLabel: string;
  showPct?: boolean;
}

function SectionTable({ title, headerColor, titleColor, rows, levelLabel, showPct = false }: SectionTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const row = activeRef.current;
      const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2;
      container.scrollTop = offset;
    }
  }, [rows]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className={'px-4 py-2.5 border-b ' + headerColor}>
        <h3 className={'text-sm font-semibold ' + titleColor}>{title}</h3>
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-[420px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0">
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">{levelLabel}</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">경험치</th>
              {showPct && <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">경험치 배율</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.level}
                ref={row.isMe ? activeRef : undefined}
                className={'border-b ' + (row.isMe ? row.rowBg + ' font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700')}
              >
                <td className={'px-3 py-1.5 text-center ' + (row.isMe ? row.textColor : 'text-gray-700 dark:text-gray-300')}>
                  {row.level}
                  {row.isMe && <span className={'ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full ' + row.badgeColor}>나</span>}
                </td>
                <td className={'px-3 py-1.5 text-center ' + (row.isMe ? row.textColor : 'text-gray-700 dark:text-gray-300')}>
                  {fmt(row.value)}
                </td>
                {showPct && (
                  <td className={'px-3 py-1.5 text-center text-xs ' + (row.isMe ? row.textColor : 'text-gray-400 dark:text-gray-500')}>
                    {pct(row.value, row.level)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface Props {
  charLevel: number;
  monsterLevel: number;
}

export default function BMExpTab({ charLevel, monsterLevel }: Props) {
  const myParkZone = getMonsterParkZone(charLevel);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionTable
          title="VIP 사우나 (1시간 경험치)"
          headerColor="bg-purple-50 dark:bg-purple-900/40 border-purple-100 dark:border-purple-800"
          titleColor="text-purple-800 dark:text-purple-300"
          levelLabel="캐릭터 레벨"
          rows={LEVELS.map(lv => ({
            level: lv, value: VIP_SAUNA_EXP[lv] ?? 0, isMe: lv === charLevel,
            badgeColor: 'bg-purple-50 dark:bg-purple-900/40', textColor: 'text-purple-700', rowBg: 'bg-purple-50 dark:bg-purple-900/40',
          }))}
        />
        <SectionTable
          title="상급 EXP 쿠폰 (1개당 경험치)"
          headerColor="bg-green-50 dark:bg-green-900/40 border-green-100 dark:border-green-800"
          titleColor="text-green-800 dark:text-green-300"
          levelLabel="캐릭터 레벨"
          rows={LEVELS.map(lv => ({
            level: lv, value: SUPER_EXP_COUPON[lv] ?? 0, isMe: lv === charLevel,
            badgeColor: 'bg-green-50 dark:bg-green-900/40', textColor: 'text-green-700', rowBg: 'bg-green-50 dark:bg-green-900/40',
          }))}
        />
        <SectionTable
          title="메카베리 농장 입장권 (레벨 280+)"
          headerColor="bg-red-50 dark:bg-red-900/40 border-red-100 dark:border-red-800"
          titleColor="text-red-800 dark:text-red-300"
          levelLabel="캐릭터 레벨"
          showPct
          rows={LEVELS.filter(lv => lv >= 280).map(lv => ({
            level: lv, value: MEKABERRY_EXP[lv] ?? 0, isMe: lv === charLevel,
            badgeColor: 'bg-red-50 dark:bg-red-900/40', textColor: 'text-red-700', rowBg: 'bg-red-50 dark:bg-red-900/40',
          }))}
        />
        <SectionTable
          title="익스프레스 부스터 (몬스터 레벨별)"
          headerColor="bg-blue-50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-800"
          titleColor="text-blue-800 dark:text-blue-300"
          levelLabel="몬스터 레벨"
          rows={LEVELS.map(lv => ({
            level: lv, value: EXPRESS_BOOSTER_EXP[lv] ?? 0, isMe: lv === monsterLevel,
            badgeColor: 'bg-blue-50 dark:bg-blue-900/40', textColor: 'text-blue-700', rowBg: 'bg-blue-50 dark:bg-blue-900/40',
          }))}
        />
      </div>

      {/* 몬스터파크 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="bg-orange-50 dark:bg-orange-900/40 border-b border-orange-100 dark:border-orange-800 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">몬스터파크 구역별 경험치</h3>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">구역</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">경험치</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(MONSTER_PARK_EXP).map(([zone, exp]) => {
              const isMe = zone === myParkZone;
              return (
                <tr key={zone} className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700')}>
                  <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700' : 'text-gray-700 dark:text-gray-300')}>
                    {zone}
                    {isMe && <span className="ml-1.5 text-xs bg-orange-50 dark:bg-orange-900/40 text-white px-1.5 py-0.5 rounded-full">나</span>}
                  </td>
                  <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700 font-bold' : 'text-gray-700 dark:text-gray-300')}>{fmt(exp)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
