'use client';

import CardHeader from '@/components/ui/CardHeader';
import { assetSlug } from '@/lib/assetSlug';

import type { InputValues, CharMeta } from '@/types';

interface Props {
  inputs: InputValues;
  meta: CharMeta | null;
  onEditInfo: () => void;
}

function toTimeStr(sessions: number): string {
  return `${sessions / 2}시간`;
}

// 박스 셀 — 라벨(위) · (아이콘) · 값(아래) 세로 중앙정렬.
// 높이 고정 + 긴 텍스트는 2줄 말줄임 → 한 셀만 길어져 행이 커지는 것을 방지.
function Cell({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  const isText = typeof children === 'string';
  return (
    <div className="h-[84px] flex flex-col items-center justify-center text-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 p-1.5 min-w-0 overflow-hidden">
      <p className="text-[11px] text-gray-400 dark:text-zinc-500 leading-none shrink-0">{label}</p>
      {icon && <img src={`/icons/${assetSlug(icon)}.png`} alt="" className="w-6 h-6 object-contain shrink-0" />}
      <div
        className={'text-[12px] text-gray-700 dark:text-zinc-200 leading-tight break-words min-w-0' + (isText ? ' line-clamp-2' : '')}
        title={isText ? (children as string) : undefined}
      >
        {children}
      </div>
    </div>
  );
}

// 부스터 개수 — VIP 부스터 / 영겁의 황금태엽을 가로로, 각각 아이콘(위) · 개수(아래)
function Boosters({ vip, eternal }: { vip: number; eternal: number }) {
  return (
    <div className="flex items-start justify-center gap-3">
      <span className="flex flex-col items-center gap-0.5">
        <img src={`/icons/${assetSlug('VIP 부스터')}.png`} alt="VIP 부스터" className="w-6 h-6 object-contain shrink-0" />
        {vip}개
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <img src={`/icons/${assetSlug('영겁의 황금태엽')}.png`} alt="영겁의 황금태엽" className="w-6 h-6 object-contain shrink-0" />
        {eternal}개
      </span>
    </div>
  );
}

// "정보 수정" 버튼 아이콘 (Feather edit, 사각형+연필)
function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
}

export default function InputSummaryCard({ inputs, meta: _meta, onEditInfo }: Props) {
  void _meta; // 보약 정보 카드 제거 후 meta 미사용 (시그니처는 호출부 호환 위해 유지)
  return (
    // 데스크톱에서 캐릭터 카드와 높이를 맞추기 위해 h-full (부모가 items-stretch)
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden lg:h-full flex flex-col">
      <CardHeader title="입력 정보" className="relative">
        <button
          onClick={onEditInfo}
          aria-label="정보 수정"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <EditIcon />
        </button>
      </CardHeader>
      {/* 3열 2행 정사각 박스 그리드 */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3">
        <Cell label="일 평균 재획" icon="소재비">{toTimeStr(inputs.dailySessions)}</Cell>
        <Cell label="30분 부스터"><Boosters vip={inputs.booster30min} eternal={inputs.eternal30min} /></Cell>
        <Cell label="1일 부스터"><Boosters vip={inputs.booster1day} eternal={inputs.eternal1day} /></Cell>
        <Cell label="에픽 던전" icon={inputs.epicDungeonZone}>{inputs.epicDungeonZone}</Cell>
        <Cell label="몬스터파크" icon={inputs.monsterParkZone}>{inputs.monsterParkZone}</Cell>
        <Cell label="사냥터" icon={inputs.huntingRegion}>{inputs.huntingGround}</Cell>
      </div>
    </div>
  );
}
