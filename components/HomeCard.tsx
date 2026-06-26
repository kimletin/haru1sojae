'use client';

import { useState } from 'react';
import type { UpdateEntry } from '@/data/updates';

const PAGE_SIZE = 5;

export default function HomeCard({ title, entries }: { title: string; entries: UpdateEntry[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const cur = Math.min(page, pageCount - 1);
  const rows = entries.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-[260px]">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="flex-1 flex flex-col">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => {
          const entry = rows[i];
          return (
            <div key={i} className={'flex-1 flex items-center gap-2.5 px-5 ' + (i < PAGE_SIZE - 1 ? 'border-b border-gray-100 dark:border-zinc-700' : '')}>
              {entry && (
                <>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap shrink-0">{entry.date}</span>
                  <span className="text-sm text-gray-800 dark:text-zinc-200 truncate">{entry.title}</span>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="shrink-0 flex items-center justify-center gap-1.5 py-2 border-t border-gray-100 dark:border-zinc-700">
        {Array.from({ length: pageCount }).map((_, p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            aria-label={`${p + 1}페이지`}
            className={'w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ' + (p === cur ? 'bg-orange-500' : 'bg-gray-300 dark:bg-zinc-600 hover:bg-gray-400 dark:hover:bg-zinc-500')}
          />
        ))}
      </div>
    </div>
  );
}
