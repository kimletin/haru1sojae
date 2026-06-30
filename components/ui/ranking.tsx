// 순위(랭킹) 공용 유틸 — 가성비 순위·사냥터 효율 순위가 공유한다.

// 1위(초록) → 중간(주황) → 꼴찌(빨강) 그라데이션 색
export function rankColor(rank: number, total: number): string {
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

// 주황 순위 뱃지
export function RankBadge({ rank }: { rank: number }) {
  return (
    <span className="min-w-[20px] h-5 px-1 rounded bg-orange-500 text-white text-xs flex items-center justify-center shrink-0 font-bold">
      {rank}
    </span>
  );
}

// 값 내림차순으로 정렬된 목록에서 값이 같으면 공동 순위(1,2,2,4 식)를 매긴다.
export function computeTieRanks<T>(items: T[], valueOf: (item: T) => number): number[] {
  let prevRank = 1;
  return items.map((item, i) => {
    if (i > 0 && valueOf(items[i - 1]) !== valueOf(item)) prevRank = i + 1;
    return prevRank;
  });
}
