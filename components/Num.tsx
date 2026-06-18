'use client';

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
  const exact = n.toLocaleString('ko-KR');

  if (!isAbbreviated) {
    return <span className={className}>{abbreviated}</span>;
  }

  return (
    <span className={`relative group inline-block ${className ?? ''}`}>
      <span className="cursor-help">{abbreviated}</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
        {exact}
      </span>
    </span>
  );
}
