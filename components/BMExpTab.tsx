'use client';

import { useRef, useEffect } from 'react';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MEKABERRY_EXP } from '@/data/mekaberry';
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
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden w-[340px]">
      <div className={'px-4 py-2.5 border-b ' + headerColor}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor}>{title}</h3>
      </div>
      <div ref={scrollRef} className="overflow-y-auto overflow-x-hidden max-h-[300px]">
        <table className="table-fixed text-sm border-collapse w-full">
          <colgroup>
            {showPct ? (
              <>
                <col style={{width:'110px'}} />
                <col style={{width:'120px'}} />
                <col style={{width:'110px'}} />
              </>
            ) : (
              <>
                <col style={{width:'160px'}} />
                <col style={{width:'180px'}} />
              </>
            )}
          </colgroup>
          <thead className="sticky top-0">
            <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
              <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-medium">{levelLabel}</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-medium">경험치</th>
              {showPct && <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-medium">경험치 배율</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr
                key={row.level}
                ref={row.isMe ? activeRef : undefined}
                className={'border-b ' + (row.isMe ? row.rowBg + ' font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
              >
                <td className={'px-3 py-1.5 text-center ' + (row.isMe ? row.textColor : 'text-gray-700 dark:text-zinc-300')}>
                  {row.level}
                  {row.isMe && <span className={'ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full ' + row.badgeColor}>나</span>}
                </td>
                <td className={'px-3 py-1.5 text-center ' + (row.isMe ? row.textColor : 'text-gray-700 dark:text-zinc-300')}>
                  {fmt(row.value)}
                </td>
                {showPct && (
                  <td className={'px-3 py-1.5 text-center text-xs ' + (row.isMe ? row.textColor : 'text-gray-400 dark:text-zinc-500')}>
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
      <div className="grid grid-cols-2 gap-6">
        <SectionTable
          title="VIP 사우나 (1시간)"
          headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
          titleColor="text-gray-800 dark:text-zinc-100"
          levelLabel="캐릭터 레벨"
          rows={LEVELS.map(lv => ({
            level: lv, value: VIP_SAUNA_EXP[lv] ?? 0, isMe: lv === charLevel,
            badgeColor: 'bg-orange-500 dark:bg-orange-700', textColor: 'text-orange-600', rowBg: 'bg-orange-50 dark:bg-orange-900/40',
          }))}
        />
        <SectionTable
          title="상급 EXP 쿠폰 (1개당 경험치)"
          headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
          titleColor="text-gray-800 dark:text-zinc-100"
          levelLabel="캐릭터 레벨"
          rows={LEVELS.map(lv => ({
            level: lv, value: SUPER_EXP_COUPON[lv] ?? 0, isMe: lv === charLevel,
            badgeColor: 'bg-orange-500 dark:bg-orange-700', textColor: 'text-orange-600', rowBg: 'bg-orange-50 dark:bg-orange-900/40',
          }))}
        />
        <SectionTable
          title="메카베리 농장"
          headerColor="bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800"
          titleColor="text-gray-800 dark:text-zinc-100"
          levelLabel="캐릭터 레벨"
          showPct
          rows={LEVELS.filter(lv => lv >= 280).map(lv => ({
            level: lv, value: MEKABERRY_EXP[lv] ?? 0, isMe: lv === charLevel,
            badgeColor: 'bg-orange-500 dark:bg-orange-700', textColor: 'text-orange-600', rowBg: 'bg-orange-50 dark:bg-orange-900/40',
          }))}
        />
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden w-[340px]">
          <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">몬스터파크 경험치</h3>
          </div>
          <table className="table-fixed w-full text-sm border-collapse">
            <colgroup>
              <col style={{width:'180px'}} />
              <col style={{width:'160px'}} />
            </colgroup>
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-medium">구역</th>
                <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-medium">경험치</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(MONSTER_PARK_EXP).map(([zone, exp]) => {
                const isMe = zone === myParkZone;
                return (
                  <tr key={zone} className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}>
                    <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700' : 'text-gray-700 dark:text-zinc-300')}>
                      {zone}
                      {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                    </td>
                    <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700 font-bold' : 'text-gray-700 dark:text-zinc-300')}>
                      {fmt(exp)}
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
