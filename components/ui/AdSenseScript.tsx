'use client';

import { useEffect } from 'react';

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9335356894491039';

// 애드센스 로더를 마운트 후 <head>에 직접 주입한다.
// - raw <script>를 head에 두면: 애드센스가 hydration 전에 head를 건드려 hydration mismatch 경고
// - next/script로 두면: Next가 붙이는 data-nscript 속성 때문에 애드센스가 경고
// useEffect는 hydration이 끝난 뒤 실행되므로 위 두 경고를 모두 피하면서,
// 스크립트는 애드센스 권장 위치인 <head>에 들어간다.
export default function AdSenseScript() {
  useEffect(() => {
    if (document.querySelector(`script[src="${ADSENSE_SRC}"]`)) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = ADSENSE_SRC;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  }, []);

  return null;
}
