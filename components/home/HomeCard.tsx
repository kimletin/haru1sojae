'use client';

import CardHeader from '@/components/ui/CardHeader';
import { useSwipeCarousel } from '@/components/home/useSwipeCarousel';

const PAGE_SIZE = 5;

interface CardEntry {
  date: string;
  title: string;
  url?: string;
}

export default function HomeCard({ title, entries }: { title: string; entries: CardEntry[] }) {
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const { page: cur, setPage, trackRef, containerRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, handleClickCapture } = useSwipeCarousel(pageCount);

  const renderPage = (idx: number) => {
    const rows = idx >= 0 && idx < pageCount ? entries.slice(idx * PAGE_SIZE, idx * PAGE_SIZE + PAGE_SIZE) : [];
    return (
      <div key={idx} className="w-full shrink-0 flex flex-col">
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
    );
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={handleClickCapture}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col h-[260px] touch-pan-y">
      <CardHeader title={title} className="shrink-0" />
      <div className="flex-1 overflow-hidden">
        <div ref={trackRef} className="flex h-full" style={{ transform: 'translateX(calc(-100% + 0px))' }}>
          {renderPage(cur - 1)}
          {renderPage(cur)}
          {renderPage(cur + 1)}
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
