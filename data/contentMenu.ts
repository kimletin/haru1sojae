/** 이벤트/컨텐츠 탭 좌측 메뉴.
 *  ⚠️ 서버(`app/[[...slug]]/page.tsx`의 주소 검증)와 클라이언트(`ExpContentsTab`)가 함께 읽으므로
 *     'use client' 컴포넌트 안에 두지 않는다. 순수 데이터만 있어야 한다.
 *
 *  label에 줄바꿈(\n)을 넣으면 버튼에서 그대로 두 줄로 나온다(whitespace-pre-line)
 *  event: true면 노란 테두리 + 좌상단 EVENT 휘장 (기간은 period에 'M/D-M/D')
 *
 *  이벤트 한정 메뉴를 추가할 땐 종료 후 무엇을 함께 지워야 하는지 여기 주석으로 남긴다.
 *  (2026-11-18 종료분: 퍼스널 버닝 · 탐정예티의 수상한 돋보기 — 커밋 이력 참고) */
export interface MenuItem {
  key: string;
  label: string;
  icon: string;
  /** 노란 테두리 + 좌상단 EVENT 휘장 */
  event?: boolean;
  /** 'M/D-M/D' — event가 true인 항목에만 쓴다 */
  period?: string;
}

// ⚠️ 이벤트 항목이 하나도 없을 때 event·period가 타입에서 사라지지 않게 MenuItem[]을 명시한다
//    (ExpContentsTab의 휘장·기간 렌더가 두 필드를 읽는다)
export const MENU_ITEMS: MenuItem[] = [
  { key: 'epicdungeon', label: '에픽 던전', icon: '앵글러컴퍼니' },
  { key: 'monsterpark', label: '몬스터파크', icon: '몬스터파크' },
  { key: 'treasurehunter', label: '트레져 헌터', icon: '트레져 헌터' },
  { key: 'divemap',    label: '잠수맵', icon: 'MVP 리조트' },
  { key: 'expcoupon',   label: 'EXP 교환권', icon: '상급 EXP 교환권' },
  { key: 'farm',        label: '농장 입장권', icon: '메카베리 농장' },
];

/** 메뉴 키 — /cont/<키> 주소 검증용 (메뉴마다 주소가 있어 링크 공유 · 뒤로 가기 · 새로고침이 메뉴 단위로 동작) */
export const CONTENT_KEYS: string[] = MENU_ITEMS.map(m => m.key);
