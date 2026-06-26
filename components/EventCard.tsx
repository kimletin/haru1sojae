'use client';

import { useState } from 'react';

const PAGE_SIZE = 8; // 4열 x 2행

interface EventEntry {
  date: string;
  title: string;
  url?: string;
  thumbnail?: string;
}

export default function EventCard({ entries }: { entries: EventEntry[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const cur = Math.min(page, pageCount - 1);
  const rows = entries.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  function handleWheel(e: React.WheelEvent) {
    if (pageCount <= 1) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    setPage((p) => Math.min(pageCount - 1, Math.max(0, Math.min(p, pageCount - 1) + dir)));
  }

  return (
    <div
      onWheel={handleWheel}
      className="col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">이벤트</h3>
      </div>
      <div className="flex-1 p-4">
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => {
            const entry = rows[i];
            if (!entry) return <div key={i} />;
            return (
              <a
                key={i}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1.5"
              >
                <div className="aspect-[285/120] rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800">
                  {entry.thumbnail && (
                    <img
                      src={entry.thumbnail}
                      alt=""
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  )}
                </div>
                <span className="text-xs text-gray-700 dark:text-zinc-300 truncate text-center group-hover:text-orange-500 dark:group-hover:text-orange-400">
                  {entry.title}
                </span>
              </a>
            );
          })}
        </div>
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
