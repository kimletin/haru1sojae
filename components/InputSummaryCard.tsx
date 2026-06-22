'use client';

import type { InputValues, CharMeta } from '@/types';
import TooltipWrapper from '@/components/TooltipWrapper';

type MergedBonus = { name: string; icon?: string | null; mp?: number; ep?: number; tr?: number };

function mergeBonuses(meta: CharMeta | null): MergedBonus[] {
  const map = new Map<string, MergedBonus>();
  for (const b of meta?.monsterParkBonuses ?? []) map.set(b.name, { name: b.name, icon: b.icon, mp: b.pct });
  for (const b of meta?.epicDungeonBonuses ?? []) {
    const ex = map.get(b.name);
    if (ex) ex.ep = b.pct; else map.set(b.name, { name: b.name, icon: b.icon, ep: b.pct });
  }
  for (const b of meta?.treasureBonuses ?? []) {
    const ex = map.get(b.name);
    if (ex) ex.tr = b.pct; else map.set(b.name, { name: b.name, icon: b.icon, tr: b.pct });
  }
  return Array.from(map.values());
}

interface Props {
  inputs: InputValues;
  meta: CharMeta | null;
  onEditInfo: () => void;
}

function toTimeStr(sessions: number): string {
  return `${sessions / 2}시간`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 px-4 py-1.5 text-sm">
      <span className="text-gray-800 dark:text-zinc-200 shrink-0 whitespace-nowrap">{label}</span>
      <span className="text-gray-500 dark:text-zinc-500 flex-1 min-w-0 text-right">{value}</span>
    </div>
  );
}

function bonusText(v: number | null | undefined): string {
  return v && v > 0 ? `+${v}%` : '-';
}

export default function InputSummaryCard({ inputs, meta, onEditInfo }: Props) {
  const bonuses = mergeBonuses(meta);
  return (
    <>
      {/* 사냥/컨텐츠 정보 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5 flex items-center justify-center relative">
          <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">사냥/컨텐츠 정보</h3>
          <button
            onClick={onEditInfo}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 h-[24px] text-[11px] font-medium rounded border-2 bg-orange-500 border-orange-500 text-white hover:bg-orange-600 hover:border-orange-600 transition-colors cursor-pointer whitespace-nowrap"
          >정보 수정</button>
        </div>
        <div className="py-3">
          <Row label="일 평균 재획" value={toTimeStr(inputs.dailySessions)} />
          <Row label="30분 평균 부스터" value={`VIP/HEXA ${inputs.booster30min}개 · 영겁 ${inputs.eternal30min}개`} />
          <Row label="1일 평균 부스터" value={`VIP/HEXA ${inputs.booster1day}개 · 영겁 ${inputs.eternal1day}개`} />
          <Row label="에픽 던전" value={inputs.epicDungeonZone} />
          <Row label="몬스터파크" value={inputs.monsterParkZone} />
          <Row label="사냥터" value={`${inputs.huntingRegion} · ${inputs.huntingGround}`} />
        </div>
      </div>

      {/* 보약 정보 */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">보약 정보</h3>
        </div>
        <div className="py-3">
          <div className="flex items-center gap-2 px-4 py-1.5 text-sm">
            <span className="text-gray-800 dark:text-zinc-200 shrink-0 whitespace-nowrap">보약 리스트</span>
            {bonuses.length > 0 ? (
              <div className="flex items-center justify-end gap-1.5 flex-wrap flex-1 min-w-0 cursor-default">
                {bonuses.map(b => (
                  <TooltipWrapper
                    key={b.name}
                    tipClassName="!whitespace-normal leading-relaxed"
                    tip={<>
                      <div className="text-orange-200 font-semibold mb-0.5">{b.name}</div>
                      {b.mp != null && <div className="text-gray-200">몬스터파크 추가 경험치 <span className="text-orange-300">+{b.mp}%</span></div>}
                      {b.ep != null && <div className="text-gray-200">에픽 던전 기본 보상 <span className="text-orange-300">+{b.ep}%</span></div>}
                      {b.tr != null && <div className="text-gray-200">트레져 헌터 경험치 <span className="text-orange-300">+{b.tr}%</span></div>}
                    </>}
                  >
                    {b.icon
                      ? <img src={b.icon} alt={b.name} className="w-8 h-8 rounded block" />
                      : <span className="w-8 h-8 flex items-center justify-center text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-500 rounded">E</span>
                    }
                  </TooltipWrapper>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 dark:text-zinc-500 flex-1 min-w-0 text-right">-</span>
            )}
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-700 my-2" />
          <Row label="몬스터파크 추가 경험치" value={bonusText(meta?.monsterParkBonus)} />
          <Row label="에픽 던전 기본 보상" value={bonusText(meta?.epicDungeonBonus)} />
          <Row label="트레져 헌터 추가 경험치" value={bonusText(meta?.treasureBonus)} />
        </div>
      </div>
    </>
  );
}
