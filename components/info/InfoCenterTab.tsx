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
              <p className={helpBody}><span className={helpDash}>-</span><span>하루1소재는 <span className="font-semibold text-orange-400 dark:text-orange-300">260레벨 이상</span>의 캐릭터를 대상으로 합니다. 260레벨 미만 캐릭터의 경험치 효율 및 정보는 제공되지 않습니다.</span></p>
            </div>
            <div>
              <p className={helpHeading}>가성비 배율 기준</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>가성비 배율은 <span className="font-semibold text-orange-400 dark:text-orange-300">VIP 사우나</span>를 기준(100%)으로 계산됩니다. 배율이 높을수록 VIP 사우나 대비 더 효율적인 아이템입니다.</span></p>
            </div>
            <div>
              <p className={helpHeading}>가격 환산 기준</p>
              <p className={helpBody}><span className={helpDash}>-</span><span><span className="font-semibold text-orange-400 dark:text-orange-300">넥슨캐시</span>로만 구매 가능한 아이템은 <span className="font-semibold text-orange-400 dark:text-orange-300">물통 시세</span>를 기준으로 메소 가격을 환산합니다. <span className="font-semibold text-orange-400 dark:text-orange-300">메이플포인트</span>로 구매 가능한 아이템은 <span className="font-semibold text-orange-400 dark:text-orange-300">메소마켓 수수료 1%</span>가 반영되어 있습니다.</span></p>
            </div>
            <div>
              <p className={helpHeading}>도핑류 계산 주의사항</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>경험치 도핑류 아이템의 계산에는 엘리트 몬스터, 엘리트 보스, 경험치 획득량과 관련된 경험치 이벤트 등이 반영되어 있지 않기 때문에, 해당 아이템의 효율은 다소 <span className="font-semibold text-orange-400 dark:text-orange-300">저평가</span>되어 있습니다.</span></p>
            </div>
            <div>
              <p className={helpHeading}>에픽 던전 세라자르 주화</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>에픽 던전 보너스 보상에는 <span className="font-semibold text-orange-400 dark:text-orange-300">세라자르 주화 4개</span>가 계산에 반영되어 있습니다. <span className="font-semibold text-orange-400 dark:text-orange-300">주화 가치</span>만큼 에픽 던전 비용에서 차감해 계산합니다.</span></p>
            </div>
            <div>
              <p className={helpHeading}>마스터라벨 성장 플러스</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>입력한 <span className="font-semibold text-orange-400 dark:text-orange-300">마라벨 비용</span>은 마스터라벨 <span className="font-semibold text-orange-400 dark:text-orange-300">190일</span>, 성장 플러스 <span className="font-semibold text-orange-400 dark:text-orange-300">90일</span>로 사용 기간이 달라, 두 상품을 계속 재구매해 유지하는 기준으로 환산하여 <span className="font-semibold text-orange-400 dark:text-orange-300">90/190(약 47%)</span>이 반영됩니다.</span></p>
            </div>
            <div>
              <p className={helpHeading}>패스 내 아이템 계산 기준</p>
              <p className={helpBody}><span className={helpDash}>-</span><span>패스에 포함된 <span className="font-semibold text-orange-400 dark:text-orange-300">경험치 쿠폰</span>은 부스터류 아이템을 사용하지 않은 <span className="font-semibold text-orange-400 dark:text-orange-300">순수 사냥 경험치</span>를 기준으로 계산합니다. 패스에 포함된 <span className="font-semibold text-orange-400 dark:text-orange-300">부스터류 아이템</span>은 추가 경험치 획득량 <span className="font-semibold text-orange-400 dark:text-orange-300">800%</span>를 가정해 계산합니다.</span></p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
