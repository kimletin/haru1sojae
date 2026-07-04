'use client';

import CardHeader from '@/components/ui/CardHeader';
import { useSwipeCarousel } from '@/components/home/useSwipeCarousel';

const PAGE_SIZE = 8; // 4열 x 2행

interface EventEntry {
  date: string;
  title: string;
  url?: string;
  thumbnail?: string;
}

export default function EventCard({ entries }: { entries: EventEntry[] }) {
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const { page: cur, setPage, trackRef, containerRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, handleClickCapture } = useSwipeCarousel(pageCount);

  const renderPage = (idx: number) => {
    const rows = idx >= 0 && idx < pageCount ? entries.slice(idx * PAGE_SIZE, idx * PAGE_SIZE + PAGE_SIZE) : [];
    return (
      <div key={idx} className="w-full shrink-0 p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
      className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col touch-pan-y">
      <CardHeader title="이벤트" className="shrink-0" />
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
