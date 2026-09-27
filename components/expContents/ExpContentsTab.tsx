'use client';

import CardHeader from '@/components/ui/CardHeader';
import { assetSlug } from '@/lib/assetSlug';
import SimNumInput from '@/components/expContents/SimNumInput';

import { useEffect, useState } from 'react';
import { VIP_SAUNA_EXP, MVP_RESORT_EXP } from '@/data/vipSauna';
import { MONSTER_PARK_EXP } from '@/data/monsterPark';
import { SUPER_EXP_COUPON, PERSONAL_EXP_COUPON } from '@/data/superExpCoupon';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { CRIMSON_MEKABERRY_EXP } from '@/data/crimsonMekaberry';
import { BLUEBERRY_EXP } from '@/data/blueberry';
import { PERSONAL_BOSS_EVENT_START, PERSONAL_BOSS_EVENT_END } from '@/data/personalBoss';
import type { SundayType, PersonalBossSelections } from '@/types';
import PersonalBossTab from '@/components/boss/PersonalBossTab';
import Num from '@/components/ui/Num';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { pctNoSign, type ExpTableProps } from '@/components/expContents/shared';
import SubTabs from '@/components/expContents/SubTabs';
import { SingleTable } from '@/components/expContents/SingleTable';
import EpicDungeonSection from '@/components/expContents/EpicDungeonSection';
import TreasureHunterSection from '@/components/expContents/TreasureHunterSection';
import VipSaunaSimulator from '@/components/expContents/VipSaunaSimulator';
import ExpCouponSimulator from '@/components/expContents/ExpCouponSimulator';
import MekaberrySimulator from '@/components/expContents/MekaberrySimulator';
import BlueberrySimulator from '@/components/expContents/BlueberrySimulator';
import MonsterParkSimulator from '@/components/expContents/MonsterParkSimulator';

const LEVELS = Array.from({ length: 40 }, (_, i) => i + 260);

// ─── Constants ────────────────────────────────────────────────────────────────

// 'YYYY-MM-DD' → 'M/D' (퍼스널 버닝 메뉴 버튼의 이벤트 기간 표기)
const toMonthDay = (ymd: string) => { const [, m, d] = ymd.split('-'); return `${Number(m)}/${Number(d)}`; };
const PERSONAL_BURNING_PERIOD = `${toMonthDay(PERSONAL_BOSS_EVENT_START)}-${toMonthDay(PERSONAL_BOSS_EVENT_END)}`;

const MENU_ITEMS = [
  // 퍼스널 버닝 이벤트 한정(2026-09-17 ~ 11-18) — 종료 후 삭제 (data/personalBoss.ts 머리말 참고)
  { key: 'personalburning', label: '퍼스널 버닝', icon: '퍼스널 버닝' },
  { key: 'epicdungeon', label: '에픽 던전', icon: '앵글러컴퍼니' },
  { key: 'monsterpark', label: '몬스터파크', icon: '몬스터파크' },
  { key: 'treasurehunter', label: '트레져 헌터', icon: '트레져 헌터' },
  { key: 'divemap',    label: '잠수맵', icon: 'MVP 리조트' },
  { key: 'expcoupon',   label: 'EXP 교환권', icon: '상급 EXP 교환권' },
  { key: 'farm',        label: '농장 입장권', icon: '메카베리 농장' },
];

/** 메뉴 키 — /cont/<키> 주소 검증용 (메뉴마다 주소가 있어 링크 공유 · 뒤로 가기 · 새로고침이 메뉴 단위로 동작) */
export const CONTENT_KEYS: string[] = MENU_ITEMS.map(m => m.key);


interface Props {
  charLevel: number;
  monsterLevel: number;
  monsterParkBonus: number;
  monsterParkZone: string;   // 캐릭터 정보에서 고른 지역 — 표의 '나' 표시 기준
  epicDungeonBonus?: number;
  treasureBonus?: number;
  todayExpRate?: number | null;
  slotKey?: number;
  hasCharacter?: boolean;
  /** 선택된 메뉴 키(/cont/<키>). 없거나 모르는 키면 첫 메뉴 */
  selected?: string | null;
  onSelect: (key: string) => void;
  // 퍼스널 보스 미션용 — 이벤트 종료 후 삭제
  personalBoss: PersonalBossSelections;
  onPersonalBossChange: (next: PersonalBossSelections) => void;
}

const SUNDAY_MULT: Record<SundayType, number> = { '일반': 1, '썬데이': 1.5, '스페셜': 4 };

/** 메뉴 하나가 여러 종류를 품을 때 상단 선택 버튼이 쓰는 모양.
 *  name = 표 제목(정식 명칭) / label = 버튼 표기(좁은 칸에서 줄바꿈되지 않게 축약 가능) */
interface SubChoice {
  name: string;
  label: string;
  icon: string;
  data: Record<number, number>;
}

// 잠수맵 — 계산식이 같고 레벨별 표만 다르다. 리조트는 9/17 패치로 사우나의 53/24(2.2083)배가 됐다.
const DIVE_FACILITIES: SubChoice[] = [
  { name: 'VIP 사우나', label: 'VIP 사우나', icon: 'VIP사우나', data: VIP_SAUNA_EXP },
  { name: 'MVP 리조트', label: 'MVP 리조트', icon: 'MVP 리조트', data: MVP_RESORT_EXP },
];

// 퍼스널 버닝 메뉴의 상단 탭 — 보스 처치 경험치 계산기 / 퍼스널 EXP 교환권 (이벤트 종료 후 삭제)
// 퍼스널 EXP 교환권은 상급과 계산식이 같고 표만 다르다(상급의 480/225 = 2.1333배, data/superExpCoupon.ts)
// EXP 교환권 메뉴의 상단 탭 — 지금은 상급 하나뿐(퍼스널은 퍼스널 버닝 메뉴로 옮김). 다른 메뉴와 모양을 맞추려고 한 칸이라도 둔다
const COUPON_TABS: Pick<SubChoice, 'name' | 'label' | 'icon'>[] = [
  { name: '상급 EXP 교환권', label: '상급 EXP 교환권', icon: '상급 EXP 교환권' },
];

const BURNING_TABS: Pick<SubChoice, 'name' | 'label' | 'icon'>[] = [
  { name: '퍼스널 보스',       label: '퍼스널 보스 미션',  icon: '퍼스널 보스' },
  { name: '퍼스널 EXP 교환권', label: '퍼스널 EXP 교환권', icon: '퍼스널 EXP 교환권' },
];

// 농장 입장권 — 탭 표기는 정식 명칭 그대로(모바일 2열 그리드 한 칸에 들어간다).
// minLevel = 표에 나오는 최소 레벨, sim = 시뮬레이터 종류(메카베리 계열은 계산식을 공유).
const FARMS: (SubChoice & { minLevel: number; sim: 'blue' | 'meka' })[] = [
  { name: '블루베리 농장',        label: '블루베리 농장', icon: '블루베리 농장',        data: BLUEBERRY_EXP,         minLevel: 260, sim: 'blue' },
  { name: '메카베리 농장',        label: '메카베리 농장', icon: '메카베리 농장',        data: MEKABERRY_EXP,         minLevel: 280, sim: 'meka' },
  { name: '크림슨 메카베리 농장', label: '크림슨 메카베리 농장', icon: '크림슨 메카베리 농장', data: CRIMSON_MEKABERRY_EXP, minLevel: 280, sim: 'meka' },
];

export default function ExpContentsTab({
  charLevel, monsterLevel, monsterParkBonus, monsterParkZone, epicDungeonBonus = 0, treasureBonus = 0, todayExpRate, slotKey, hasCharacter = true,
  selected: selectedKey, onSelect, personalBoss, onPersonalBossChange,
}: Props) {
  // 레벨로 유추하지 않고 사용자가 고른 지역을 그대로 쓴다(효율표와 같은 기준)
  const myParkZone = monsterParkZone;

  // 선택 메뉴는 주소(/cont/<키>)가 정한다 — 키가 없으면(/cont) 좌측 메뉴 + 선택 안내만 보여준다
  const isHub = !selectedKey || !CONTENT_KEYS.includes(selectedKey);
  const selected = isHub ? MENU_ITEMS[0].key : selectedKey;
  const isPersonalBoss = selected === 'personalburning';

  // 잠수맵 시설 선택 (VIP 사우나 / MVP 리조트)
  const [diveFacility, setDiveFacility] = useState(DIVE_FACILITIES[0].name);
  const dive = DIVE_FACILITIES.find(f => f.name === diveFacility) ?? DIVE_FACILITIES[0];

  // 퍼스널 버닝 상단 탭 (퍼스널 보스 / 퍼스널 EXP 교환권)
  const [burningTab, setBurningTab] = useState(BURNING_TABS[0].name);
  const showBossCalc = isPersonalBoss && burningTab === '퍼스널 보스';

  // 교환권 표·시뮬레이터 — EXP 교환권 메뉴는 상급, 퍼스널 버닝의 교환권 탭은 퍼스널
  const coupon =
    selected === 'expcoupon' ? { name: '상급 EXP 교환권', data: SUPER_EXP_COUPON }
    : isPersonalBoss && burningTab === '퍼스널 EXP 교환권' ? { name: '퍼스널 EXP 교환권', data: PERSONAL_EXP_COUPON }
    : null;

  // 농장 선택 (블루베리 / 메카베리 / 크림슨 메카베리)
  const [farmType, setFarmType] = useState(FARMS[0].name);
  const farm = FARMS.find(f => f.name === farmType) ?? FARMS[0];


  // 몬스터파크 보약 체크박스
  const [parkBonusInput, setParkBonusInput] = useState(monsterParkBonus > 0 ? String(monsterParkBonus) : '');

  // 몬스터파크 썬데이메이플
  const [sundayType, setSundayType] = useState<SundayType>('일반');

  useEffect(() => {
    setParkBonusInput(monsterParkBonus > 0 ? String(monsterParkBonus) : '');
  }, [monsterParkBonus, slotKey]);

  const commonRowProps = {
    badgeColor: 'bg-orange-500 dark:bg-orange-700',
    textColor: 'text-orange-600',
    rowBg: 'bg-orange-50 dark:bg-orange-900/40',
  };

  // 메뉴 하나가 여러 종류를 품는 콘텐츠 — 표/시뮬레이터 위에 상단 선택 버튼을 띄운다
  const subChoices: { items: Pick<SubChoice, 'name' | 'label' | 'icon'>[]; current: string; set: (name: string) => void } | null =
    selected === 'personalburning' ? { items: BURNING_TABS,    current: burningTab,   set: setBurningTab }
    : selected === 'divemap'   ? { items: DIVE_FACILITIES, current: diveFacility, set: setDiveFacility }
    : selected === 'expcoupon'  ? { items: COUPON_TABS,     current: COUPON_TABS[0].name, set: () => {} }
    : selected === 'farm'       ? { items: FARMS,           current: farmType,     set: setFarmType }
    : null;

  const isEpic = selected === 'epicdungeon';
  const newLayout = ['farm', 'divemap'].includes(selected) || coupon != null;
  // 메카베리 계열(일반/크림슨)은 시뮬레이터 계산식을 공유한다
  const isMekaberryLike = selected === 'farm' && farm.sim === 'meka';

  // newLayout 4종 경험치표 props (인라인 + 모달 공용)
  const splitProps: ExpTableProps | null =
    selected === 'divemap' ? { title: dive.name, valueLabel: '1시간 당 경험치', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: dive.data[lv] ?? 0, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : coupon ? { title: coupon.name, valueLabel: '1000개 당 경험치', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: (coupon.data[lv] ?? 0) * 1000, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : selected === 'farm' ? { title: farm.name, headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.filter(lv => lv >= farm.minLevel).map(lv => ({ level: lv, value: farm.data[lv] ?? 0, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : null;

  // 블루베리/메카베리/크림슨 메카베리 농장 팁 콜아웃 (경험치표 위에 표시)
  const tipCalloutClass = 'rounded-xl border border-orange-200 dark:border-orange-900/50 border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-900/20 px-3 py-2.5 text-[11px] lg:text-[12px] leading-relaxed shrink-0';
  const tipIcon = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
  const berryTip = selected !== 'farm' ? null :
    farm.name === '블루베리 농장' ? (
      <div className={tipCalloutClass}>
        <div className="flex items-center gap-1 mb-1 font-bold text-orange-600 dark:text-orange-400">{tipIcon}블루베리 농장 팁</div>
        <ul className="space-y-0.5 text-gray-600 dark:text-zinc-300">
          <li>Lv.260–269 = 동렙몹 <span className="font-semibold">475,200마리</span></li>
          <li>Lv.270–279 = 동렙몹 <span className="font-semibold">712,800마리</span> <span className="text-orange-500 dark:text-orange-400">(전 구간 대비 50% ↑)</span></li>
          <li>Lv.280 이상 = 279레벨과 동일</li>
        </ul>
        <p className="mt-1.5 text-gray-700 dark:text-zinc-200">270레벨 이상에서 가중치가 <span className="font-bold text-orange-600 dark:text-orange-400">50% 상승</span>하므로, 블루베리 입장권은 가급적 <span className="font-bold text-orange-600 dark:text-orange-400">270레벨 이상</span>에서 사용을 추천합니다.</p>
      </div>
    ) : farm.name === '메카베리 농장' ? (
      <div className={tipCalloutClass}>
        <div className="flex items-center gap-1 mb-1 font-bold text-orange-600 dark:text-orange-400">{tipIcon}메카베리 농장 팁</div>
        <ul className="space-y-0.5 text-gray-600 dark:text-zinc-300">
          <li>Lv.280–284 = 동렙몹 <span className="font-semibold">950,400마리</span></li>
          <li>Lv.285–289 = 동렙몹 <span className="font-semibold">1,267,200마리</span> <span className="text-orange-500 dark:text-orange-400">(전 구간 대비 33.3% ↑)</span></li>
          <li>Lv.290–299 = 동렙몹 <span className="font-semibold">1,372,800마리</span> <span className="text-orange-500 dark:text-orange-400">(전 구간 대비 8.3% ↑)</span></li>
        </ul>
        <p className="mt-1.5 text-gray-700 dark:text-zinc-200">레벨이 높을수록 가중치가 <span className="font-bold text-orange-600 dark:text-orange-400">상승</span>하므로, 메카베리 입장권은 가급적 <span className="font-bold text-orange-600 dark:text-orange-400">높은 레벨</span>에서 사용을 추천합니다.</p>
      </div>
    ) : farm.name === '크림슨 메카베리 농장' ? (
      <div className={tipCalloutClass}>
        <div className="flex items-center gap-1 mb-1 font-bold text-orange-600 dark:text-orange-400">{tipIcon}크림슨 메카베리 농장 팁</div>
        <ul className="space-y-0.5 text-gray-600 dark:text-zinc-300">
          <li>Lv.280–299 = 동렙몹 <span className="font-semibold">1,478,400마리</span> <span className="text-orange-500 dark:text-orange-400">(전 구간 동일)</span></li>
        </ul>
        <p className="mt-1.5 text-gray-700 dark:text-zinc-200">메카베리 농장과 달리 <span className="font-bold text-orange-600 dark:text-orange-400">모든 레벨 구간의 가중치가 동일</span>하므로, 레벨과 관계없이 언제 사용해도 획득 경험치 비율이 같습니다.</p>
      </div>
    ) : null;

  // 퍼스널 EXP 교환권 팁 콜아웃 (퍼스널 버닝 메뉴의 교환권 탭, 경험치표 위에 표시) — 이벤트 종료 후 삭제
  const couponTip = coupon?.name === '퍼스널 EXP 교환권' ? (
    <div className={tipCalloutClass}>
      <div className="flex items-center gap-1 mb-1 font-bold text-orange-600 dark:text-orange-400">{tipIcon}퍼스널 EXP 교환권 팁</div>
      <ul className="space-y-0.5 text-gray-600 dark:text-zinc-300">
        <li>퍼스널 플레임 커스텀 포인트를 모두 <span className="font-semibold">퍼스널 EXP</span>에 투자하면 주당 최대 <span className="font-semibold">720개</span>를 획득할 수 있습니다.</li>
        <li>따라서 이벤트 기간 <span className="font-semibold">9주</span> 동안 최대 <span className="font-semibold">6,480개</span>를 획득할 수 있습니다.</li>
      </ul>
    </div>
  ) : null;

  // 좌측 메뉴 버튼
  const renderMenuButton = (item: typeof MENU_ITEMS[number], active: boolean) => (
    <button
      key={item.key}
      onClick={() => onSelect(item.key)}
      className={
        'relative h-[72px] lg:h-auto lg:aspect-square rounded-lg shadow-sm text-xs font-medium transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-center border ' +
        (active
          ? 'bg-orange-500 text-white '
          : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 ') +
        // 이벤트 메뉴(퍼스널 보스)는 노란 테두리로 표시
        (item.key === 'personalburning'
          ? 'border-yellow-400'
          : active ? 'border-orange-500' : 'border-gray-200 dark:border-zinc-600')
      }
    >
      {/* 이벤트 메뉴 휘장 — 버튼 좌상단 모서리에 걸쳐 붙인다 */}
      {item.key === 'personalburning' && (
        <span className="absolute -top-1.5 -left-1.5 px-1.5 py-px rounded-md bg-orange-600 text-white text-[10px] font-bold leading-tight shadow-sm ring-2 ring-white dark:ring-zinc-900 pointer-events-none">
          EVENT
        </span>
      )}
      <img src={`/icons/${assetSlug(item.icon)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
      <span>
        {item.label}
        {/* 이벤트 기간 — 라벨 아래 작은 글씨 */}
        {item.key === 'personalburning' && (
          <span className={'block text-[10px] font-normal leading-tight ' + (active ? 'text-white/80' : 'text-gray-400 dark:text-zinc-400')}>
            {PERSONAL_BURNING_PERIOD}
          </span>
        )}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
      {/* 좌측 메뉴 (모바일/태블릿: 4열 2행 그리드 / lg(905px)~: 세로 90px 정사각형 고정) */}
      <div className="grid grid-cols-4 lg:grid-cols-1 gap-1.5 shrink-0 w-full lg:w-[90px] self-start">
        {MENU_ITEMS.map(item => renderMenuButton(item, !isHub && selected === item.key))}
      </div>

      {/* /cont — 아직 메뉴를 고르지 않았으면 우측에 안내만 띄운다 */}
      {isHub ? (
        // PC: 행 높이(= 좌측 메뉴 높이)로 늘어나 문구가 메뉴 세로 중앙에 온다 / 모바일: 메뉴 아래 높이 12rem 박스
        // (flex-1은 PC에서만 — 모바일 세로 flex에서 flex-basis가 h-48을 덮어써 높이가 안 먹는다)
        <div className="lg:flex-1 min-w-0 h-48 lg:h-auto bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm flex flex-col items-center justify-center gap-2 text-sm text-gray-400 dark:text-zinc-500">
          <img src="/icons/Event.png" alt="" className="w-10 h-10 object-contain" />
          컨텐츠를 선택해 주세요
        </div>
      ) : (
      /* 우측 콘텐츠 영역: 콜아웃(블루베리/메카베리) + 표/시뮬레이터
         상단 선택 버튼 · 농장 팁 콜아웃 · 표/시뮬레이터 사이는 에픽 던전·트레져 헌터와 같은 6px */
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* 하위 종류 선택(잠수맵 / EXP 교환권 / 농장) — 표+시뮬레이터 전체 폭을 덮도록 맨 위에 둔다.
            농장 팁 콜아웃보다도 위 — 선택에 따라 팁 내용이 바뀌므로 버튼이 먼저 와야 읽힌다. */}
        {subChoices && (
          <SubTabs
            items={subChoices.items.map(it => ({ key: it.name, label: it.label, icon: it.icon }))}
            current={subChoices.current}
            onSelect={subChoices.set}
          />
        )}
        {berryTip}
        {couponTip}
        {/* 퍼스널 보스 미션 — 캐릭터 없이도 레벨을 직접 넣어 계산할 수 있다. 슬롯을 바꾸면 key로 입력값 초기화 */}
        {showBossCalc && (
          <PersonalBossTab
            key={slotKey}
            charLevel={charLevel}
            hasCharacter={hasCharacter}
            selections={personalBoss}
            onChange={onPersonalBossChange}
          />
        )}
        {/* 표/시뮬레이터 (모바일/태블릿: 세로 스택, 시뮬레이터가 위로 오도록 flex-col-reverse / lg(905px)~: 좌우 배치) */}
        {!showBossCalc && (
        <div className={'flex gap-4 flex-col-reverse items-stretch lg:flex-row lg:items-start ' + (newLayout || selected === 'monsterpark' ? 'lg:flex-row-reverse' : '')}>
        {isEpic ? (
          <EpicDungeonSection charLevel={charLevel} epicDungeonBonus={epicDungeonBonus} hasCharacter={hasCharacter} />
        ) : (
          <>
            {/* 좌측 카드 */}
            <div className="flex-1 min-w-0 flex flex-col">
              {selected === 'monsterpark' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col" style={{maxHeight:'664px'}}>
                  <CardHeader title="몬스터파크" className="shrink-0" />
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div>
                      <table className="table-fixed w-full text-[12px] lg:text-sm border-collapse">
                        <colgroup>
                          <col style={{width:'50%'}} />
                          <col style={{width:'50%'}} />
                        </colgroup>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                            <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold">지역</th>
                            <th className="text-center px-3 py-2 text-gray-600 dark:text-zinc-400 font-bold">경험치</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(MONSTER_PARK_EXP).map(([zone, baseExp]) => {
                            const sundayBonus = SUNDAY_MULT[sundayType] - 1;
                            const potionBonus = (parseFloat(parkBonusInput) || 0) / 100;
                            const exp = Math.round(baseExp * (1 + sundayBonus + potionBonus));
                            const isMe = hasCharacter && zone === myParkZone;
                            const subColor = isMe ? 'text-orange-500' : 'text-gray-400 dark:text-zinc-500';
                            return (
                              <tr
                                key={zone}
                                className={'border-b ' + (isMe ? 'bg-orange-50 dark:bg-orange-900/40 font-bold' : 'hover:bg-gray-50 dark:hover:bg-gray-700')}
                              >
                                <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700' : 'text-gray-700 dark:text-zinc-300')}>
                                  {zone}
                                  {isMe && <span className="ml-1.5 text-xs bg-orange-500 dark:bg-orange-700 text-white px-1.5 py-0.5 rounded-full">나</span>}
                                </td>
                                <td className={'px-3 py-2 text-center ' + (isMe ? 'text-orange-700 font-bold' : 'text-gray-700 dark:text-zinc-300')}>
                                  <Num n={exp} />
                                  {hasCharacter && <span className={'text-xs ml-1 ' + subColor}>(+{pctNoSign(exp, charLevel)})</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="px-4 py-2 flex items-center justify-between border-t border-gray-100 dark:border-zinc-700 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">썬데이</span>
                      {([
                        { val: '일반',   tip: '+0%' },
                        { val: '썬데이', tip: '+50%' },
                        { val: '스페셜', tip: '+300%' },
                      ] as const).map(({ val, tip }) => (
                        <TooltipWrapper key={val} tip={tip}>
                          <button
                            onClick={() => setSundayType(val)}
                            className={`text-xs px-2 py-0.5 rounded border cursor-pointer transition-colors ${sundayType === val ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}
                          >
                            {val === '스페셜' ? '스페셜썬데이' : val}
                          </button>
                        </TooltipWrapper>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 dark:text-zinc-400">보약</span>
                      <SimNumInput value={parkBonusInput} onChange={setParkBonusInput} unit="%" pad="4" width="w-14" height="h-[22px]" max={200} />
                    </div>
                  </div>
                </div>
              )}

              {newLayout && splitProps && <SingleTable {...splitProps} />}

              {selected === 'treasurehunter' && <TreasureHunterSection monsterLevel={monsterLevel} treasureBonus={treasureBonus} hasCharacter={hasCharacter} />}

            </div>

            {/* 시뮬레이터 카드 */}
            {selected !== 'treasurehunter' && <div className={newLayout ? 'flex-1 flex flex-col gap-4' : 'flex-1 lg:self-start flex flex-col gap-4'}>
              {selected === 'divemap' ? (
                // key = 선택한 상단 탭 → 탭을 바꾸면 시뮬레이터·목표 레벨 역산 입력값이 초기화된다
                // (같은 컴포넌트를 쓰는 메카베리↔크림슨에서 이전 표로 계산한 결과가 남는 것도 막는다)
                <VipSaunaSimulator key={dive.name} charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} expTable={dive.data} />
              ) : coupon ? (
                <ExpCouponSimulator key={coupon.name} charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} expTable={coupon.data} />
              ) : isMekaberryLike ? (
                <MekaberrySimulator key={farm.name} charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} expTable={farm.data} />
              ) : selected === 'farm' ? (
                <BlueberrySimulator key={farm.name} charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} />
              ) : (
                <MonsterParkSimulator charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} monsterParkBonus={monsterParkBonus} />
              )}
              </div>}
          </>
        )}
        </div>
        )}
      </div>
      )}

    </div>
  );
}
