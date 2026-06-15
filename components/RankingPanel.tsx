'use client';

import { EfficiencyItem } from '@/types';

interface Props {
  items: EfficiencyItem[];
}

const CATEGORY_COLOR: Record<EfficiencyItem['category'], string> = {
  '30분 도핑': 'bg-green-100 text-green-700',
  '30일 도핑': 'bg-blue-100 text-blue-700',
  'BM':        'bg-orange-100 text-orange-700',
  '마진':      'bg-purple-100 text-purple-700',
};

function rankColor(rank: number, total: number): string {
  const t = total <= 1 ? 0 : (rank - 1) / (total - 1);
  let r, g, b;
  if (t <= 0.5) {
    const s = t * 2;
    r = Math.round(34 + (234 - 34) * s);
    g = Math.round(197 + (179 - 197) * s);
    b = Math.round(94 + (8 - 94) * s);
  } else {
    const s = (t - 0.5) * 2;
    r = Math.round(234 + (220 - 234) * s);
    g = Math.round(179 + (38 - 179) * s);
    b = Math.round(8 + (38 - 8) * s);
  }
  return `rgb(${r},${g},${b})`;
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">
      {rank}
    </span>
  );
}

export default function RankingPanel({ items }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col flex-1">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">가성비 순위</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-zinc-700"
          >
            <RankBadge rank={i + 1} />
            <span className="text-sm text-gray-800 dark:text-zinc-200 truncate flex-1">{item.name}</span>
<span className="text-sm font-semibold text-right ml-2" style={{ color: rankColor(i + 1, items.length) }}>
              {(item.ratio * 100).toFixed(1) + '%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
