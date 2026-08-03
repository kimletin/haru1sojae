'use client';

import TooltipWrapper from '@/components/ui/TooltipWrapper';

interface NumProps {
  n: number;
  className?: string;
}

// 소수 2자리로 자르되 끝의 불필요한 0 제거: 3.00→3, 1.20→1.2, 1.23→1.23
function trimZeros(v: number): string {
  return v.toFixed(2).replace(/\.?0+$/, '');
}
export function fmtNum(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return trimZeros(n / 1e12) + '조';
  if (abs >= 1e8)  return trimZeros(n / 1e8) + '억';
  if (abs >= 1e4)  return trimZeros(n / 1e4) + '만';
  return n.toLocaleString('ko-KR');
}

export default function Num({ n, className }: NumProps) {
  const abs = Math.abs(n);
  const isAbbreviated = abs >= 1e4;
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
