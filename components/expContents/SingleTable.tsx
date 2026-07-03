'use client';
import { useRef, useEffect } from 'react';
import Num from '@/components/ui/Num';
import { pctNoSign, type ExpTableProps } from '@/components/expContents/shared';

// ─── SingleTable (단일 컬럼, 부모 높이에 맞춰 스크롤) ──────────────────────────
export function SingleTable({ title, headerColor, titleColor, rows, levelLabel, valueLabel = '경험치', fillHeight = true }: ExpTableProps & { fillHeight?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (activeRef.current && scrollRef.current) {
        const container = scrollRef.current;
        const row = activeRef.current;
        const rowTop = row.offsetTop;
        const rowHeight = row.offsetHeight;
        container.scrollTop = rowTop - container.clientHeight / 2 + rowHeight / 2;
      }
    });
  }, [rows]);

  return (
    <div className={'bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col' + (fillHeight ? ' min-[720px]:h-full' : '')}>
      <div className={'px-4 py-2.5 border-b shrink-0 ' + headerColor}>
        <h3 className={'text-sm font-semibold text-center ' + titleColor}>{title}</h3>
      </div>
      <div ref={scrollRef} className="overflow-y-auto flex-1 min-h-0">
        <table className="table-fixed text-sm border-collapse w-full">
          <colgroup>
            <col style={{width:'50%'}} /><col style={{width:'50%'}} />
          </colgroup>
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
              <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">{levelLabel}</th>
              <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const meBg = row.isMe ? row.rowBg + ' font-bold ' : '';
              const txt = row.isMe ? row.textColor : 'text-gray-700 dark:text-zinc-300';
              const sub = row.isMe ? row.textColor : 'text-gray-400 dark:text-zinc-500';
              return (
                <tr key={row.level} ref={row.isMe ? activeRef : undefined} className={'border-b ' + (row.isMe ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}>
                  <td className={meBg + 'px-3 py-1.5 text-center ' + txt}>
                    {row.level}
                    {row.isMe && <span className={'ml-1.5 text-xs text-white px-1.5 py-0.5 rounded-full ' + row.badgeColor}>나</span>}
                  </td>
                  <td className={meBg + 'px-3 py-1.5 text-center ' + txt}>
                    <Num n={row.value} />
                    <span className={'text-xs ml-1 ' + sub}>(+{pctNoSign(row.value, row.level)})</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
