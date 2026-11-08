/** 홈 상단 띠에 띄우는 운영 공지(점검·방침 개정 등). 넥슨 공지(`/api/notice`)와는 별개다.
 *
 *  - 띠가 한 줄이라 **최신 1건**만 띄운다.
 *  - `until`을 주면 그 날짜가 지날 때 저절로 사라진다. 안 주면 직접 내릴 때까지 계속 뜬다.
 *  - 목록이 비거나 전부 만료면 띠 자체가 렌더되지 않는다.
 *  - 만료돼도 배열에 남겨두면 정보 센터 업데이트 내역에는 이력으로 남는다.
 *    다만 예고한 일이 실제로 처리된 공지는 혼란만 주므로 그때는 빼는 쪽을 택한다. */
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

// 역할을 다한 공지는 목록에서 빼도 된다(예고한 일이 실제로 처리된 경우).
// 비어 있으면 홈 띠도 업데이트 내역의 공지 줄도 그리지 않는다.
export const NOTICES: Notice[] = [];

/** 오늘(KST) 기준 띄울 공지 — 아직 만료되지 않은 것 중 가장 최근 게시물. 없으면 null */
export function getActiveNotice(): Notice | null {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  // 날짜가 ISO(YYYY-MM-DD)라 문자열 비교로 대소가 그대로 성립한다
  const live = NOTICES.filter(n => n.date <= kst && (!n.until || kst <= n.until));
  if (live.length === 0) return null;
  return live.reduce((a, b) => (b.date > a.date ? b : a));
}
