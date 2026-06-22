// 모달 오픈 시 본문 스크롤 컨테이너(#app-scroll)의 스크롤을 잠근다.
// #app-scroll에 scrollbar-gutter: stable이 있어 overflow:hidden으로 바꿔도 거터가 유지 → 밀림 없음.
function scrollEl(): HTMLElement | null {
  return document.getElementById('app-scroll');
}

export function lockScroll() {
  const el = scrollEl();
  if (el) el.style.overflow = 'hidden';
}

export function unlockScroll() {
  const el = scrollEl();
  if (el) el.style.overflow = '';
}
