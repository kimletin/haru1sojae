'use client';

import CardHeader from '@/components/ui/CardHeader';

import { useState } from 'react';
import UpdateTimeline from '@/components/info/UpdateTimeline';

const SECTIONS = ['업데이트 내역', '도움말'] as const;
type Section = typeof SECTIONS[number];

export default function InfoCenterTab() {
  const [activeSection, setActiveSection] = useState<Section>('업데이트 내역');

  return (
    <div className="w-full flex flex-col">
      <div className="flex gap-2 mb-4 shrink-0 justify-end">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={
              'px-4 py-1.5 rounded-lg shadow-sm text-sm font-medium transition-colors cursor-pointer ' +
              (activeSection === s
                ? 'bg-orange-500 text-white border border-orange-500'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col">
        <CardHeader title={activeSection} className="shrink-0" />

        {activeSection === '업데이트 내역' && (
          <div className="p-6 flex-1">
            <UpdateTimeline />
          </div>
        )}

        {activeSection === '도움말' && (
          <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed flex-1">
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">📌 서비스 대상</p>
              <p>하루1소재는 <span className="font-semibold text-orange-500">260레벨 이상</span>의 캐릭터를 대상으로 합니다. 260레벨 미만 캐릭터의 경험치 효율 및 정보는 제공되지 않습니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">💡 가성비 배율 기준</p>
              <p>가성비 배율은 <span className="font-semibold text-orange-500">VIP 사우나</span>를 기준(100%)으로 계산됩니다. 배율이 높을수록 VIP 사우나 대비 더 효율적인 아이템입니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">⚠️ 도핑류 계산 주의사항</p>
              <p>경험치 도핑류 아이템의 계산에는 엘리트 몬스터, 엘리트 보스, 경험치 획득량과 관련된 경험치 이벤트 등이 반영되어 있지 않기 때문에, 해당 아이템의 효율은 다소 <span className="font-semibold text-orange-500">저평가</span>되어 있습니다.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
