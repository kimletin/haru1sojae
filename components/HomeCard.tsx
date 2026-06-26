'use client';

import { useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 5;

interface CardEntry {
  date: string;
  title: string;
  url?: string;
}

export default function HomeCard({ title, entries }: { title: string; entries: CardEntry[] }) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const cur = Math.min(page, pageCount - 1);
  const rows = entries.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el || pageCount <= 1) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault(); // 페이지만 넘기고 화면 스크롤은 막음
      const dir = e.deltaY > 0 ? 1 : -1;
      setPage((p) => Math.min(pageCount - 1, Math.max(0, Math.min(p, pageCount - 1) + dir)));
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [pageCount]);

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-[260px]">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 shrink-0">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="flex-1 flex flex-col">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => {
          const entry = rows[i];
          const border = i < PAGE_SIZE - 1 ? 'border-b border-gray-100 dark:border-zinc-700' : '';
          const inner = entry && (
            <>
              <span className="text-xs text-gray-400 dark:text-zinc-500 whitespace-nowrap shrink-0">{entry.date}</span>
              <span className="text-sm text-gray-800 dark:text-zinc-200 truncate">{entry.title}</span>
            </>
          );
          if (entry?.url) {
            return (
              <a
                key={i}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={'flex-1 flex items-center gap-2.5 px-5 transition-colors hover:bg-orange-50 dark:hover:bg-zinc-800 ' + border}
              >
                {inner}
              </a>
            );
          }
          return (
            <div key={i} className={'flex-1 flex items-center gap-2.5 px-5 ' + border}>
              {inner}
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
