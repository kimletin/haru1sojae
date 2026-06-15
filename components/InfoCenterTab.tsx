'use client';

import { useState } from 'react';

const SECTIONS = ['업데이트 내역', '도움말'] as const;
type Section = typeof SECTIONS[number];

interface UpdateEntry {
  date: string;
  title: string;
  items?: string[];
}

const UPDATES: UpdateEntry[] = [
  {
    date: '2026.06.18.',
    title: 'ver.1.2.416 패치',
    items: [
      '295~299 구간 메카베리 농장, VIP 사우나, MVP 리조트 경험치 업데이트',
      '에픽 던전 기본 보상 세라자르 주화 2개 → 솔 에르다 조각 15개로 변경',
    ],
  },
  {
    date: '2026.06.15.',
    title: '서비스 오픈',
    items: ['Mapleff 오픈'],
  },
];

export default function InfoCenterTab() {
  const [activeSection, setActiveSection] = useState<Section>('업데이트 내역');

  return (
    <div className="w-[680px]">
      <div className="flex gap-2 mb-4">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ' +
              (activeSection === s ? 'bg-orange-500 text-white' : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700')
            }
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 overflow-hidden">
        <div className="bg-orange-200 dark:bg-orange-900/50 border-b border-orange-200 dark:border-orange-800 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-center text-gray-800 dark:text-zinc-100">{activeSection}</h3>
        </div>

        {activeSection === '업데이트 내역' && (
          <div className="p-6">
            <div className="relative">
              <div className="space-y-6">
                {UPDATES.map((entry, i) => (
                  <div key={i} className="relative pl-7">
                    {i < UPDATES.length - 1 && (
                      <div className="absolute left-[6px] top-4 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-zinc-700" />
                    )}
                    <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900" />
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-600 rounded-full px-2 py-0.5 whitespace-nowrap">{entry.date}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">{entry.title}</span>
                    </div>
                    {entry.items && (
                      <ul className="mt-1 space-y-0.5">
                        {entry.items.map((item, j) => (
                          <li key={j} className="text-sm text-gray-600 dark:text-zinc-400 flex gap-1.5">
                            <span className="shrink-0">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === '도움말' && (
          <div className="p-5 space-y-4 text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">💡 부스터 개수 입력</p>
              <p>30분 도핑 표의 부스터 입력란에는 30분 동안 사용할 부스터 개수를, 30일 도핑 표에는 하루 평균 사용하는 부스터 개수를 입력하세요. 부스터를 많이 사용할수록 도핑 아이템의 효율이 올라갑니다. 부스터를 사용하지 않는다면 0으로 두시면 됩니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">💡 몬스터파크 자동 설정</p>
              <p>필요 정보의 캐릭터 레벨을 입력하면, 해당 레벨에서 입장 가능한 가장 높은 몬스터파크 구역이 자동으로 반영됩니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">💡 가성비 배율 기준</p>
              <p>가성비 배율은 VIP 사우나를 기준(100%)으로 계산됩니다. 배율이 높을수록 VIP 사우나 대비 더 효율적인 아이템입니다.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 mb-1">💡 캐릭터 이름 편집</p>
              <p>상단의 캐릭터 버튼을 더블클릭하면 이름을 직접 수정할 수 있습니다. 최대 12글자까지 입력 가능하며, 비워두면 기본값으로 돌아갑니다.</p>
            </div>
          </div>
        )}
      </div>

      {activeSection === '도움말' && (
        <div className="flex justify-center mt-4">
          <a
            href="https://open.kakao.com/me/letin_k"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex"
            title="카카오톡 문의"
          >
            <div className="w-9 h-9 rounded-[9px] bg-gray-300 group-hover:bg-yellow-400 transition-colors flex items-center justify-center">
              <svg width="24" height="20" viewBox="0 0 24 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="12" cy="9" rx="12" ry="9" className="fill-gray-500 group-hover:fill-[#3A1D1D] transition-colors"/>
                <polygon points="3,18 7,13 5,19.5" className="fill-gray-500 group-hover:fill-[#3A1D1D] transition-colors"/>
              </svg>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
