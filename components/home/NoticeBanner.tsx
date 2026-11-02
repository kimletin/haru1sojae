'use client';

import { getActiveNotice } from '@/data/notices';
import { MegaphoneIcon } from '@/components/ui/Icons';

/** 홈 최상단 운영 공지 띠. 공지가 없거나 `until`이 지나면 아무것도 그리지 않는다.
 *  기간이 지나면 저절로 사라지므로 닫기 버튼은 두지 않는다.
 *  ⚠️ 다크 색은 zinc·orange 계열로만 쓴다 — globals.css의 `.dark .text-gray-*`·`.border-gray-*`가
 *     !important라 같은 요소의 dark: 지정을 덮어쓴다. */
export default function NoticeBanner({ onNavigate }: { onNavigate?: (href: string) => void }) {
  const notice = getActiveNotice();
  if (!notice) return null;

  return (
    <div className="w-full max-w-[905px] flex items-center gap-2.5 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 px-4 py-2.5 text-orange-700 dark:text-orange-200">
      <MegaphoneIcon className="shrink-0 w-[18px] h-[18px]" />

      {notice.href ? (
        <a
          href={notice.href}
          onClick={e => { e.preventDefault(); onNavigate?.(notice.href!); }}
          className="flex-1 text-left text-sm font-medium hover:underline text-orange-700 dark:text-orange-200"
        >{notice.text}</a>
      ) : (
        <p className="flex-1 text-left text-sm font-medium">{notice.text}</p>
      )}
    </div>
  );
}
