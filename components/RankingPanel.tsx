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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-500 font-bold text-sm">🥇</span>;
  if (rank === 2) return <span className="text-gray-400 dark:text-gray-500 font-bold text-sm">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold text-sm">🥉</span>;
  return <span className="text-xs text-gray-400 dark:text-gray-500 w-6 text-center">{rank}</span>;
}

export default function RankingPanel({ items }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="bg-purple-50 dark:bg-purple-900/40 border-b border-purple-100 dark:border-purple-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">가성비 순위</h3>
      </div>
      <div className="space-y-1 max-h-[600px] overflow-y-auto p-4">
        {items.map((item, i) => (
          <div
            key={item.name}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
              i < 3 ? 'bg-amber-50 dark:bg-amber-900/40' : 'hover:bg-gray-50 dark:hover:bg-gray-700:bg-gray-700'
            }`}
          >
            <RankBadge rank={i + 1} />
            <span className="text-sm text-gray-800 dark:text-gray-200 truncate flex-1">{item.name}</span>
<span className={`text-sm font-semibold text-right ml-2 ${
              item.ratio >= 1 ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {(item.ratio * 100).toFixed(1) + '%'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
