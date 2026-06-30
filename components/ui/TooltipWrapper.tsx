'use client';

import { useState, useRef, ReactNode } from 'react';

interface Props {
  tip: ReactNode;
  children: ReactNode;
  className?: string;
  tipClassName?: string;
  followCursor?: boolean;
}

export default function TooltipWrapper({ tip, children, className, tipClassName, followCursor }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

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
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: followCursor ? 'none' : 'translateX(-50%) translateY(-100%)',
          }}
          className={`pointer-events-none bg-gray-800 text-white text-[11px] whitespace-nowrap rounded-lg px-2.5 py-1.5 z-50 shadow-lg ${tipClassName ?? ''}`}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
