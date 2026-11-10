// 경험치 콘텐츠 표 공용 — pctNoSign 헬퍼 + 공용 타입.
import { LEVEL_EXP } from '@/data/levelExp';

// 퍼센트 표시 (메인 값)
export function pctNoSign(exp: number, level: number) {
  const req = LEVEL_EXP[level]?.required;
  if (!req) return '';
  return ((exp / req) * 100).toFixed(3) + '%';
}

export interface ExpTableProps {
  title: string;
  headerColor: string;
  titleColor: string;
  rows: { level: number; value: number; isMe: boolean; badgeColor: string; textColor: string; rowBg: string }[];
  levelLabel: string;
  valueLabel?: string;
  /** 경험치 옆 (+x.xxx%) 표시 여부. 행이 몬스터 레벨인 표는 캐릭터가 없으면 숨긴다 */
  showPct?: boolean;
  /** %의 분모로 쓸 레벨. 없으면 행 레벨을 쓴다.
   *  행이 몬스터 레벨인 표(돋보기)는 경험치를 받는 쪽이 캐릭터라 캐릭터 레벨을 넘겨야 한다 —
   *  행 레벨을 쓰면 "몹 레벨 기준 경험치통"이라는 없는 기준이 된다 */
  pctLevel?: number;
  /** 카드 맨 아래에 붙는 줄 (에픽 던전 표의 보약 입력칸과 같은 자리) */
  footer?: React.ReactNode;
}

export interface BonusEntry { name: string; pct: number; }
