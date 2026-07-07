import { LEVEL_EXP } from '@/data/levelExp';

// 캐릭터 카드·상세 모달이 공유하는 경험치 히스토리/랭킹 관련 타입·계산 유틸.

export interface HistoryPoint {
  date: string;
  expRate: number;
  level: number;
  exp?: number;
}

export interface Slot {
  date: string;
  expRate: number | null;
  level: number | null;
  exp: number | null;
}

export interface RankPoint {
  date: string;
  ranking: number | null;
}

export interface Ranking {
  overall: number | null;
  world: number | null;
  class: number | null;
  overallHistory?: RankPoint[];
  worldHistory?: RankPoint[];
  classHistory?: RankPoint[];
}

export function kstDate(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return kst.toISOString().slice(0, 10);
}

// 최근 days일의 표시용 날짜(오래된 날 → 오늘 순)
export function getDisplayDates(days: number): string[] {
  return Array.from({ length: days }, (_, i) => kstDate(days - 1 - i));
}

export function computeSlots(points: HistoryPoint[], days = 7): Slot[] {
  const map = new Map(points.map(p => [p.date, p]));
  return getDisplayDates(days).map(date => {
    const p = map.get(date);
    return { date, expRate: p?.expRate ?? null, level: p?.level ?? null, exp: p?.exp ?? null };
  });
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function formatDateKR(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 ${days[d.getUTCDay()]}요일`;
}

export function formatExpKR(exp: number): string {
  if (exp === 0) return '0';
  const jo = Math.floor(exp / 1_000_000_000_000);
  const eok = Math.floor((exp % 1_000_000_000_000) / 100_000_000);
  const man = Math.floor((exp % 100_000_000) / 10_000);
  const rest = exp % 10_000;
  const parts: string[] = [];
  if (jo > 0) parts.push(`${jo}조`);
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);
  if (rest > 0) parts.push(String(rest));
  return parts.join(' ');
}

// 두 슬롯 사이 경험치 증가량 계산 (레벨업 가로질러 반영)
// character_exp는 현재 레벨 내 누적치라 레벨업 시 리셋되므로, levelExp 테이블로 보정한다.
export function computeDelta(prev: Slot | null, slot: Slot): { deltaRate: number; deltaExp: number } {
  if (prev?.expRate == null || slot.expRate == null) return { deltaRate: 0, deltaExp: 0 };
  const l1 = prev.level, l2 = slot.level;
  const p1 = prev.expRate, p2 = slot.expRate;

  // 레벨 정보가 없거나 동일 레벨: 단순 차이
  if (l1 == null || l2 == null || l1 === l2) {
    const deltaExp = slot.exp != null && prev.exp != null ? slot.exp - prev.exp : 0;
    return { deltaRate: p2 - p1, deltaExp };
  }

  // 레벨이 내려간 비정상 케이스: 폴백
  if (l2 < l1) return { deltaRate: p2 - p1, deltaExp: 0 };

  // 레벨업: (어제 레벨 잔여%) + (중간 레벨 100%씩) + (오늘 레벨%)
  const deltaRate = (100 - p1) + 100 * (l2 - l1 - 1) + p2;

  let deltaExp = 0;
  if (slot.exp != null && prev.exp != null) {
    const req1 = LEVEL_EXP[l1]?.required;
    if (req1 != null) {
      deltaExp = req1 - prev.exp; // 어제 레벨 마무리분
      for (let L = l1 + 1; L < l2; L++) deltaExp += LEVEL_EXP[L]?.required ?? 0; // 중간 레벨 전체
      deltaExp += slot.exp; // 오늘 레벨 누적분
    }
  }
  return { deltaRate, deltaExp };
}
