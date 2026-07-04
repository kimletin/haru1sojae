'use client';

import { useState, useRef, useLayoutEffect, useEffect, ReactNode, RefObject } from 'react';

interface Props {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  tipClassName?: string;
  followCursor?: boolean;
}

const EDGE_MARGIN = 8; // 화면 경계로부터 최소 여백(px)

export default function TooltipWrapper({ tip, children, className, tipClassName, followCursor }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);

  const show = (e: React.MouseEvent) => {
    if (followCursor) {
      setPos({ x: e.clientX + 14, y: e.clientY + 14 });
    } else {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 6 });
    }
    setOpen(true);
  };

  // 렌더된 실제 툴팁 크기를 측정해 화면 밖으로 나가면 안쪽으로 밀어넣는다 (페인트 전에 적용해 깜빡임 없음)
  // 위치는 항상 left:0/top:0 + transform: translate(...)로만 잡는다 — left/top 좌표값 자체로 위치를 잡으면
  // 커서가 화면 오른쪽 끝에 가까울 때 브라우저가 "남은 공간"을 박스의 자동 폭으로 오인해 줄바꿈이 일찍 일어남
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!open || !el) return;
    const base = followCursor ? '' : ' translateX(-50%) translateY(-100%)';
    el.style.transform = `translate(${pos.x}px, ${pos.y}px)${base}`;
    const rect = el.getBoundingClientRect();
    let dx = 0;
    if (rect.right > window.innerWidth - EDGE_MARGIN) dx = (window.innerWidth - EDGE_MARGIN) - rect.right;
    if (rect.left + dx < EDGE_MARGIN) dx = EDGE_MARGIN - rect.left;
    let dy = 0;
    if (rect.bottom > window.innerHeight - EDGE_MARGIN) dy = (window.innerHeight - EDGE_MARGIN) - rect.bottom;
    if (rect.top + dy < EDGE_MARGIN) dy = EDGE_MARGIN - rect.top;
    if (dx !== 0 || dy !== 0) {
      el.style.transform += ` translate(${dx}px, ${dy}px)`;
    }
  }, [open, pos, followCursor]);

  // 스크롤하면 위치가 어긋나므로 툴팁을 닫는다
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    return () => window.removeEventListener('scroll', close, true);
  }, [open]);

  if (!tip) return <span className={className ?? 'inline-block'}>{children}</span>;

  return (
    <span
      ref={ref}
      className={className ?? 'inline-block'}
      onMouseEnter={show}
      onMouseMove={followCursor ? (e) => setPos({ x: e.clientX + 14, y: e.clientY + 14 }) : undefined}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          ref={tipRef}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            transform: followCursor ? `translate(${pos.x}px, ${pos.y}px)` : `translate(${pos.x}px, ${pos.y}px) translateX(-50%) translateY(-100%)`,
          }}
          className={`pointer-events-none max-w-[240px] bg-gray-800 text-white text-[11px] whitespace-normal leading-relaxed rounded-lg px-2.5 py-1.5 z-50 shadow-lg ${tipClassName ?? ''}`}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
