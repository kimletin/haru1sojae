import { PERSONAL_BOSS_EVENT_START, PERSONAL_BOSS_EVENT_END } from '@/data/personalBoss';

// 'YYYY-MM-DD' → 'M/D' (퍼스널 버닝 메뉴 버튼의 이벤트 기간 표기)
const toMonthDay = (ymd: string) => { const [, m, d] = ymd.split('-'); return `${Number(m)}/${Number(d)}`; };
const PERSONAL_BURNING_PERIOD = `${toMonthDay(PERSONAL_BOSS_EVENT_START)}-${toMonthDay(PERSONAL_BOSS_EVENT_END)}`;

/** 이벤트/컨텐츠 탭 좌측 메뉴.
 *  ⚠️ 서버(`app/[[...slug]]/page.tsx`의 주소 검증)와 클라이언트(`ExpContentsTab`)가 함께 읽으므로
 *     'use client' 컴포넌트 안에 두지 않는다. 순수 데이터만 있어야 한다.
 *
 *  label에 줄바꿈(\n)을 넣으면 버튼에서 그대로 두 줄로 나온다(whitespace-pre-line)
 *  event: true면 노란 테두리 + 좌상단 EVENT 휘장 */
export const MENU_ITEMS = [
  // 퍼스널 버닝 이벤트 한정(2026-09-17 ~ 11-18) — 종료 후 삭제 (data/personalBoss.ts 머리말 참고)
  { key: 'personalburning', label: '퍼스널 버닝', icon: '퍼스널 버닝', event: true, period: PERSONAL_BURNING_PERIOD },
  // 돋보기 이벤트 한정(2026-10-22 점검 후 ~ 11-18 23:59) — 종료 후 삭제
  // (메뉴 · MAGNIFIERS · MagnifierSimulator · 효율표 2행 · 가격 입력칸 priceMagnifier/priceYetiMagnifier)
  { key: 'magnifier', label: '탐정예티의\n수상한 돋보기', icon: '탐정예티의 수상한 돋보기 이벤트', event: true, period: '10/22-11/18' },
  { key: 'epicdungeon', label: '에픽 던전', icon: '앵글러컴퍼니' },
  { key: 'monsterpark', label: '몬스터파크', icon: '몬스터파크' },
  { key: 'treasurehunter', label: '트레져 헌터', icon: '트레져 헌터' },
  { key: 'divemap',    label: '잠수맵', icon: 'MVP 리조트' },
  { key: 'expcoupon',   label: 'EXP 교환권', icon: '상급 EXP 교환권' },
  { key: 'farm',        label: '농장 입장권', icon: '메카베리 농장' },
];

/** 메뉴 키 — /cont/<키> 주소 검증용 (메뉴마다 주소가 있어 링크 공유 · 뒤로 가기 · 새로고침이 메뉴 단위로 동작) */
export const CONTENT_KEYS: string[] = MENU_ITEMS.map(m => m.key);
