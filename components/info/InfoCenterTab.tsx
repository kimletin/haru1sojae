'use client';

import CardHeader from '@/components/ui/CardHeader';

import { useState } from 'react';
import UpdateTimeline from '@/components/info/UpdateTimeline';

const SECTIONS = ['업데이트 내역', '도움말'] as const;
type Section = typeof SECTIONS[number];

// 도움말 항목 제목 — 이모지는 환경별 폰트에 없으면 깨질 수 있어(예: 🪙 Unicode 14) 쓰지 않는다
const helpHeading = 'text-base font-semibold text-orange-500 dark:text-orange-400 mb-1';
// 내용 앞의 - 는 flex로 띄운다 (줄바꿈된 둘째 줄이 기호 아래로 말려들지 않게)
const helpBody = 'flex gap-1.5';
const helpDash = 'text-orange-400 dark:text-orange-300 shrink-0';

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
              <p className={helpHeading}>서비스 대상</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>하루1소재는 <span className="font-semibold text-orange-400 dark:text-orange-300">260레벨 이상</span> 캐릭터를 대상으로 해요. 260레벨 미만 캐릭터의 경험치 효율과 정보는 제공되지 않아요.</span></p>
            </div>
            <div>
              <p className={helpHeading}>가성비 배율 기준</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>가성비 배율은 <span className="font-semibold text-orange-400 dark:text-orange-300">VIP 사우나</span>를 100%로 두고 나머지를 비교해요. 배율이 높을수록 같은 메소로 더 많은 경험치를 얻을 수 있어요. 캐릭터 레벨과 입력 정보에 따라 순위가 바뀌므로 내 캐릭터를 추가해 정확한 순위를 확인해보세요.</span></p>
            </div>
            <div>
              <p className={helpHeading}>가격 환산 기준</p>
              <p className={helpBody}><span className={helpDash}>-</span><span><span className="font-semibold text-orange-400 dark:text-orange-300">넥슨캐시</span>로만 구매 가능한 아이템은 <span className="font-semibold text-orange-400 dark:text-orange-300">물통(현금거래) 시세</span>를 기준으로 메소 가격을 환산해요. <span className="font-semibold text-orange-400 dark:text-orange-300">메이플포인트</span>로 구매 가능한 아이템은 <span className="font-semibold text-orange-400 dark:text-orange-300">메소마켓 수수료 1%</span>를 반영해요. 시세를 직접 입력해서 정확한 효율을 확인해보세요.</span></p>
            </div>
            <div>
              <p className={helpHeading}>경험치 수치 계산 기준</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>레벨별 몬스터 경험치와 각 컨텐츠의 획득량은 <span className="font-semibold text-orange-400 dark:text-orange-300">인게임 실측값</span>으로 역산해 맞춘 값이에요. 예를 들어 <span className="font-semibold text-orange-400 dark:text-orange-300">추가 경험치 50% 쿠폰</span>은 30분 동안 선택한 사냥터에서 사냥한다고 가정하고, 사냥터 몹 마릿수와 사용하는 부스터 개수를 포함해 계산해요. 항목별 자세한 기준은 효율표 각 카드 제목 우측의 <span className="font-semibold text-orange-400 dark:text-orange-300">?</span> 버튼을 눌러 확인해보세요.</span></p>
            </div>
            <div>
              <p className={helpHeading}>도핑류 계산 주의사항</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>경험치 도핑류 아이템의 계산에는 엘리트 몬스터, 엘리트 보스, 경험치 획득량과 관련된 경험치 이벤트 등이 반영되어 있지 않아서, 해당 아이템의 효율은 다소 <span className="font-semibold text-orange-400 dark:text-orange-300">저평가</span>되어 있어요.</span></p>
            </div>
            {/* 에픽 던전 세라자르 주화 · 마스터라벨 성장 플러스 · 패스 내 아이템 계산 기준은
                효율표(경험치 BM · 이벤트 BM) 표 제목의 '?' 툴팁으로 옮겼다 — EfficiencyTab 참고 */}
          </div>
        )}
      </div>

    </div>
  );
}
