// 모달 오픈 시 본문 스크롤 컨테이너(#app-scroll)의 스크롤을 잠근다.
// body도 함께 position:fixed로 고정 — 모바일에서 overflow:hidden만으로는 배경 터치 드래그 스크롤이
// 막히지 않는 경우가 있어(특히 iOS Safari), body를 고정하는 방식으로 확실히 막는다.
function scrollEl(): HTMLElement | null {
  return document.getElementById('app-scroll');
}

let savedScrollY = 0;

export function lockScroll() {
  const el = scrollEl();
  if (el) el.style.overflow = 'hidden';

  savedScrollY = window.scrollY;
  const body = document.body.style;
  body.position = 'fixed';
  body.top = `-${savedScrollY}px`;
  body.left = '0';
  body.right = '0';
  body.overflow = 'hidden';
}

export function unlockScroll() {
  const el = scrollEl();
  if (el) el.style.overflow = '';

  const body = document.body.style;
  body.position = '';
  body.top = '';
  body.left = '';
  body.right = '';
  body.overflow = '';
  window.scrollTo(0, savedScrollY);
}
