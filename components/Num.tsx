'use client';

import TooltipWrapper from '@/components/TooltipWrapper';

interface NumProps {
  n: number;
  className?: string;
}

export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (abs >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  return n.toLocaleString('ko-KR');
}

export default function Num({ n, className }: NumProps) {
  const abs = Math.abs(n);
  const isAbbreviated = abs >= 1e8;
  const abbreviated = fmtNum(n);
  const exact = Math.round(n).toLocaleString('ko-KR');

  if (!isAbbreviated) {
    return <span className={className}>{abbreviated}</span>;
  }

  return (
    <TooltipWrapper tip={exact} className={className}>
      <span className="cursor-help">{abbreviated}</span>
    </TooltipWrapper>
  );
}
