'use client';

import { EfficiencyItem } from '@/types';
import ItemName from '@/components/ItemName';
import TooltipWrapper from '@/components/TooltipWrapper';

function expPer100M(efficiency: number): React.ReactNode {
  return (
    <div className="text-center">
      <div className="text-orange-200">1억 메소 당 경험치</div>
      <div className="font-semibold">{Math.round(efficiency * 1e8).toLocaleString('ko-KR')}</div>
    </div>
  );
}

interface Props {
  items: EfficiencyItem[];
}

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
    <span className="min-w-[20px] h-5 px-1 rounded bg-orange-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">
      {rank}
    </span>
  );
}

export default function RankingPanel({ items }: Props) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col">
      <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">가성비 순위</h3>
      </div>
      <div>
        {items.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-2 px-4 h-[36px] transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-zinc-700"
          >
            <RankBadge rank={i + 1} />
            <span className="text-sm text-gray-800 dark:text-zinc-200 flex-1 flex items-center gap-0.5 min-w-0"><ItemName name={item.name} /></span>
{item.efficiency > 0 ? (
              <TooltipWrapper className="ml-2 shrink-0" tip={expPer100M(item.efficiency)}>
                <span className="text-sm font-semibold cursor-default" style={{ color: rankColor(i + 1, items.length) }}>
                  {(item.ratio * 100).toFixed(1) + '%'}
                </span>
              </TooltipWrapper>
            ) : (
              <span className="text-sm font-semibold text-right ml-2" style={{ color: rankColor(i + 1, items.length) }}>
                {(item.ratio * 100).toFixed(1) + '%'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
