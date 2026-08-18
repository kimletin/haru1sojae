'use client';
import { useRef, useEffect } from 'react';

/** 경험치표가 한 화면에 보여줄 최대 행(레벨) 수 — 그 이상은 내부 스크롤 */
export const TABLE_MAX_ROWS = 20;

/** 표 본문 높이를 정확히 TABLE_MAX_ROWS개 행으로 제한한다.
 *
 *  행 높이는 브레이크포인트·폰트 크기에 따라 달라져 px 상수로 두면 19행/21행처럼 어긋나므로
 *  실제 렌더된 행을 측정해 계산한다(thead는 sticky로 스크롤 영역 안에 있어 함께 더한다).
 *
 *  - 행 수가 제한 이하(예: 280~299 20행)면 제한 없이 전체를 펼친다.
 *  - lg(905px) 미만 모바일도 제한 없음 — 전체 행을 펼치고 페이지 스크롤에 맡기는 기존 방침 유지.
 */
export function useRowsViewport(rowCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const apply = () => {
      if (rowCount <= TABLE_MAX_ROWS || window.innerWidth < 905) {
        el.style.maxHeight = '';
        return;
      }
      const headH = el.querySelector('thead')?.getBoundingClientRect().height ?? 0;
      const rowH = el.querySelector('tbody tr')?.getBoundingClientRect().height ?? 0;
      if (!rowH) return;
      el.style.maxHeight = `${Math.round(headH + rowH * TABLE_MAX_ROWS)}px`;
    };

    // 폰트 로드 전 측정을 피하려고 페인트 직후에 한 번 적용
    const frame = requestAnimationFrame(apply);
    window.addEventListener('resize', apply);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', apply);
    };
  }, [rowCount]);

  return scrollRef;
}
