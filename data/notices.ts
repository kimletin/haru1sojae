/** 홈 상단 띠에 띄우는 운영 공지(점검·방침 개정 등). 넥슨 공지(`/api/notice`)와는 별개다.
 *
 *  - 띠가 한 줄이라 **최신 1건**만 띄운다.
 *  - `until`을 주면 그 날짜가 지날 때 저절로 사라진다. 안 주면 직접 내릴 때까지 계속 뜬다.
 *  - 목록이 비거나 전부 만료면 띠 자체가 렌더되지 않는다.
 *  - 만료된 공지도 배열에 남겨둔다 — 띠에서는 내려가고 정보 센터 업데이트 내역에만 이력으로 남는다. */
export type Notice = {
  /** 닫음 기억용 키. 내용을 고치면 id도 바꿔야 이미 닫은 사람에게 다시 뜬다 */
  id: string;
  /** 게시일 YYYY-MM-DD */
  date: string;
  /** 이 날짜까지만 띄운다(당일 포함) YYYY-MM-DD. 없으면 직접 내릴 때까지 계속 띄운다 */
  until?: string;
  text: string;
  /** 누르면 이동할 경로. 없으면 안내 문구로만 쓰인다 */
  href?: string;
};

export const NOTICES: Notice[] = [
  {
    // ⚠️ 자동 만료를 일부러 안 걸었다(2026-11-02 결정) — 다음 업데이트 때 직접 내린다
    id: 'privacy-20261109',
    date: '2026-11-02',
    text: '개인정보처리방침이 2026년 11월 9일부로 개정됩니다.',
    href: '/privacy',
  },
];

/** 오늘(KST) 기준 띄울 공지 — 아직 만료되지 않은 것 중 가장 최근 게시물. 없으면 null */
export function getActiveNotice(): Notice | null {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 날짜가 ISO(YYYY-MM-DD)라 문자열 비교로 대소가 그대로 성립한다
  const live = NOTICES.filter(n => n.date <= kst && (!n.until || kst <= n.until));
  if (live.length === 0) return null;
  return live.reduce((a, b) => (b.date > a.date ? b : a));
}
