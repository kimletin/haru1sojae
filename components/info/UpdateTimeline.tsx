import { UPDATES } from '@/data/updates';

export default function UpdateTimeline() {
  return (
    <div className="space-y-6 text-left">
      {UPDATES.map((entry, i) => (
        <div key={i} className="relative pl-7">
          {i < UPDATES.length - 1 && (
            <div className="absolute left-[6px] top-4 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-zinc-700" />
          )}
          <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900" />
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-600 rounded-full px-2 py-0.5 whitespace-nowrap">{entry.date}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">{entry.title}</span>
          </div>
          {entry.items && (
            <ul className="mt-1 space-y-0.5">
              {entry.items.map((item, j) => (
                <li key={j} className="text-sm text-gray-600 dark:text-zinc-400 flex gap-1.5">
                  <span className="shrink-0">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
