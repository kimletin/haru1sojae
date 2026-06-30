import type { ReactNode } from 'react';

// 주황 카드 헤더 — 앱 전역 카드 상단의 공용 헤더.
// title: 가운데 제목. children: 우측 편집 버튼·툴팁 등 부가 요소(필요 시 className에 flex/relative 지정).
export default function CardHeader({
  title,
  className = '',
  children,
}: {
  title: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 ${className}`}>
      <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">{title}</h3>
      {children}
    </div>
  );
}
