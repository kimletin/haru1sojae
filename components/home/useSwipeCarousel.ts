import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 40; // px
const SETTLE_MS = 220;

// 터치 드래그 중엔 손가락을 따라 실시간으로 이동, 손을 떼면 다음/이전 슬라이드로 애니메이션하며 넘어가거나 원위치로 복귀.
// 페이지가 실제로 바뀌는 시점(트랜지션 종료 후)에만 state를 갱신하고, 그 즉시 transform을 애니메이션 없이 원위치(0)로
// 리셋해서 이어붙인다 — 그 순간 렌더되는 콘텐츠(새 페이지)와 화면에 보이던 콘텐츠(옛 다음/이전 슬라이드)가 동일하므로 깜빡임 없음.
export function useSwipeCarousel(pageCount: number) {
  const [page, setPage] = useState(0);
  const cur = Math.min(page, Math.max(0, pageCount - 1));
  const trackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelLock = useRef(false);
  const drag = useRef({ startX: 0, active: false, dragged: false, width: 0 });

  const applyTransform = (px: number, animate: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? `transform ${SETTLE_MS}ms ease-out` : 'none';
    el.style.transform = `translateX(calc(-100% + ${px}px))`;
  };

  useLayoutEffect(() => {
    applyTransform(0, false);
  }, [cur]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    const d = drag.current;
    d.startX = e.clientX;
    d.active = true;
    d.dragged = false;
    d.width = trackRef.current?.parentElement?.clientWidth ?? 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (e.pointerType !== 'touch' || !d.active) return;
    let dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.dragged = true;
    if (dx > 0 && cur === 0) dx = 0;
    if (dx < 0 && cur === pageCount - 1) dx = 0;
    applyTransform(dx, false);
  };

  const commit = (newPage: number, targetPx: number) => {
    const el = trackRef.current;
    let done = false;
    const timer = window.setTimeout(finish, SETTLE_MS + 40);
    function finish() {
      if (done) return;
      done = true;
      el?.removeEventListener('transitionend', finish);
      clearTimeout(timer);
      setPage(newPage);
    }
    el?.addEventListener('transitionend', finish);
    applyTransform(targetPx, true);
  };

  // 데스크톱: 마우스 휠(또는 트랙패드)로 페이지 전환. React onWheel은 passive라 preventDefault가 안 먹으므로
  // 네이티브 리스너(passive:false)로 붙인다. 첫/마지막 페이지에서 더 굴리면 preventDefault를 안 해 정상 페이지 스크롤로 넘긴다.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || pageCount <= 1) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 4) return;
      const dir = delta > 0 ? 1 : -1;
      // 경계에서 더 굴리면 카드에 갇히지 않게 그대로 페이지 스크롤 허용
      if ((dir > 0 && cur >= pageCount - 1) || (dir < 0 && cur <= 0)) return;
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      const width = trackRef.current?.parentElement?.clientWidth ?? el.clientWidth;
      commit(cur + dir, dir > 0 ? -width : width);
      window.setTimeout(() => { wheelLock.current = false; }, SETTLE_MS + 80);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [cur, pageCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (e.pointerType !== 'touch' || !d.active) return;
    d.active = false;
    let dx = e.clientX - d.startX;
    if (dx > 0 && cur === 0) dx = 0;
    if (dx < 0 && cur === pageCount - 1) dx = 0;

    if (dx <= -DRAG_THRESHOLD && cur < pageCount - 1) {
      commit(cur + 1, -d.width);
    } else if (dx >= DRAG_THRESHOLD && cur > 0) {
      commit(cur - 1, d.width);
    } else {
      applyTransform(0, true);
    }
  };

  // 대각선 드래그 등으로 브라우저가 세로 스크롤로 제스처를 가로채면 pointercancel이 뜬다 —
  // 이때 드래그 상태가 active로 남아 트랙이 중간에 멈춘 채로 굳는 걸 방지하고 원위치로 되돌린다
  const onPointerCancel = (e: React.PointerEvent) => {
    const d = drag.current;
    if (e.pointerType !== 'touch' || !d.active) return;
    d.active = false;
    d.dragged = false;
    applyTransform(0, true);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (drag.current.dragged) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.dragged = false;
    }
  };

  return { page: cur, setPage, trackRef, containerRef, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, handleClickCapture };
}
