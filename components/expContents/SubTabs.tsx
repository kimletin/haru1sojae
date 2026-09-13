'use client';
import { assetSlug } from '@/lib/assetSlug';

export interface SubTabItem<K extends string = string> {
  key: K;
  label: string;
  /** assetSlugs 키 */
  icon: string;
  /** 기본 png — 트레져 박스 아이콘만 webp */
  iconExt?: 'png' | 'webp';
  /** 아이콘 여백이 제각각인 이미지 보정용(예: 트레져 박스 'scale-125') */
  iconClassName?: string;
}

interface Props<K extends string> {
  items: SubTabItem<K>[];
  current: K;
  onSelect: (key: K) => void;
}

/** cont 탭 상단의 종류 선택 탭 줄 (트레져 헌터 · 에픽 던전 · 잠수맵 · EXP 교환권 · 농장).
 *  좌측 메뉴(1차)보다 가볍게 보이도록 낮은 높이 + 작은 아이콘을 쓴다.
 *  PC: 내용 폭만큼 좌측 정렬 — 메뉴마다 탭 개수(2~4)가 달라도 같은 모양으로 보인다.
 *  모바일: 2열 균등 그리드 — 내용 폭 그대로 줄바꿈하면 줄 끝이 들쭉날쭉해서.
 *          탭 수가 홀수면 마지막 줄에 한 칸이 빈다(칸 폭을 통일하려고 늘리지 않는다). */
export default function SubTabs<K extends string>({ items, current, onSelect }: Props<K>) {
  return (
    <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-1.5 shrink-0">
      {items.map(it => {
        const active = current === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onSelect(it.key)}
            className={
              'h-9 lg:h-10 px-3 rounded-lg flex items-center justify-center gap-1.5 text-[12px] lg:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ' +
              (active
                ? 'bg-orange-500 text-white border border-orange-500'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
            }
          >
            <img
              src={`/icons/${assetSlug(it.icon)}.${it.iconExt ?? 'png'}`}
              alt=""
              className={'w-5 h-5 shrink-0 object-contain ' + (it.iconClassName ?? '')}
            />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
