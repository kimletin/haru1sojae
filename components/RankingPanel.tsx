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
  if (rank === 2) return <span className="text-gray-400 font-bold text-sm">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold text-sm">🥉</span>;
  return <span className="text-xs text-gray-400 w-6 text-center">{rank}</span>;
}

export default function RankingPanel({ items }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">가성비 순위 (VIP 사우나 = 1.00 기준)</h3>
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {items.map((item, i) => (
          <div
            key={item.name}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
              i < 3 ? 'bg-amber-50' : 'hover:bg-gray-50'
            }`}
          >
            <RankBadge rank={i + 1} />
            <span className="flex-1 text-sm text-gray-800 truncate">{item.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[item.category]}`}>
              {item.category}
            </span>
            <span className={`text-sm font-semibold w-14 text-right ${
              item.ratio >= 1 ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {item.ratio.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
