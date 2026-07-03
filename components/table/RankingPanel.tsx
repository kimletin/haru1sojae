'use client';

import CardHeader from '@/components/ui/CardHeader';

import { EfficiencyItem } from '@/types';
import ItemName from '@/components/ui/ItemName';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { rankColor, RankBadge, computeTieRanks } from '@/components/ui/ranking';

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

export default function RankingPanel({ items }: Props) {
  // 계산값(ratio)이 같으면 공동 순위 — 표시 반올림이 아닌 원본 값 기준
  const ranks = computeTieRanks(items, (it) => it.ratio);
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col">
      <CardHeader title="가성비 순위" />
      <div>
        {items.map((item, i) => (
          <div
            key={item.name}
            className="flex items-center gap-2 px-4 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-zinc-700"
          >
            <RankBadge rank={ranks[i]} />
            <span className="text-sm text-gray-700 dark:text-zinc-300 flex-1 flex items-center gap-0.5 min-w-0"><ItemName name={item.name} /></span>
{item.efficiency > 0 ? (
              <TooltipWrapper className="ml-2 shrink-0" tip={expPer100M(item.efficiency)}>
                <span className="text-sm font-semibold cursor-default" style={{ color: rankColor(ranks[i], items.length) }}>
                  {(item.ratio * 100).toFixed(1) + '%'}
                </span>
              </TooltipWrapper>
            ) : (
              <span className="text-sm font-semibold text-right ml-2" style={{ color: rankColor(ranks[i], items.length) }}>
                {(item.ratio * 100).toFixed(1) + '%'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
