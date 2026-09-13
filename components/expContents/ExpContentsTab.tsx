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
import type { SundayType } from '@/types';
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

const MENU_ITEMS = [
  { key: 'epicdungeon', label: '에픽 던전', icon: '앵글러컴퍼니' },
  { key: 'monsterpark', label: '몬스터파크', icon: '몬스터파크' },
  { key: 'treasurehunter', label: '트레져 헌터', icon: '트레져 헌터' },
  { key: 'vipsauna',    label: '잠수맵', icon: 'MVP 리조트' },
  { key: 'expcoupon',   label: 'EXP 교환권', icon: '상급 EXP 교환권' },
  { key: 'farm',        label: '농장 입장권', icon: '메카베리 농장' },
];


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

// EXP 교환권 — 계산식이 같고 레벨별 표만 다르다. 퍼스널은 상급의 480/225 = 2.1333배.
const COUPON_TYPES: SubChoice[] = [
  { name: '상급 EXP 교환권', label: '상급 EXP 교환권', icon: '상급 EXP 교환권', data: SUPER_EXP_COUPON },
  { name: '퍼스널 EXP 교환권', label: '퍼스널 EXP 교환권', icon: '퍼스널 EXP 교환권', data: PERSONAL_EXP_COUPON },
];

// 농장 입장권 — 탭 표기는 정식 명칭 그대로(모바일 2열 그리드 한 칸에 들어간다).
// minLevel = 표에 나오는 최소 레벨, sim = 시뮬레이터 종류(메카베리 계열은 계산식을 공유).
const FARMS: (SubChoice & { minLevel: number; sim: 'blue' | 'meka' })[] = [
  { name: '블루베리 농장',        label: '블루베리 농장', icon: '블루베리 농장',        data: BLUEBERRY_EXP,         minLevel: 260, sim: 'blue' },
  { name: '메카베리 농장',        label: '메카베리 농장', icon: '메카베리 농장',        data: MEKABERRY_EXP,         minLevel: 280, sim: 'meka' },
  { name: '크림슨 메카베리 농장', label: '크림슨 메카베리 농장', icon: '크림슨 메카베리 농장', data: CRIMSON_MEKABERRY_EXP, minLevel: 280, sim: 'meka' },
];

export default function ExpContentsTab({ charLevel, monsterLevel, monsterParkBonus, monsterParkZone, epicDungeonBonus = 0, treasureBonus = 0, todayExpRate, slotKey, hasCharacter = true }: Props) {
  // 레벨로 유추하지 않고 사용자가 고른 지역을 그대로 쓴다(효율표와 같은 기준)
  const myParkZone = monsterParkZone;

  // 진입 시 좌측 메뉴의 첫 항목 — 메뉴 순서를 바꾸면 기본 선택도 따라간다
  const [selected, setSelected] = useState(MENU_ITEMS[0].key);

  // 잠수맵 시설 선택 (VIP 사우나 / MVP 리조트)
  const [diveFacility, setDiveFacility] = useState(DIVE_FACILITIES[0].name);
  const dive = DIVE_FACILITIES.find(f => f.name === diveFacility) ?? DIVE_FACILITIES[0];

  // EXP 교환권 종류 선택 (상급 / 퍼스널)
  const [couponType, setCouponType] = useState(COUPON_TYPES[0].name);
  const coupon = COUPON_TYPES.find(c => c.name === couponType) ?? COUPON_TYPES[0];

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
  const subChoices: { items: SubChoice[]; current: string; set: (name: string) => void } | null =
    selected === 'vipsauna'  ? { items: DIVE_FACILITIES, current: diveFacility, set: setDiveFacility }
    : selected === 'expcoupon' ? { items: COUPON_TYPES,    current: couponType,   set: setCouponType }
    : selected === 'farm'      ? { items: FARMS,           current: farmType,     set: setFarmType }
    : null;

  const isEpic = selected === 'epicdungeon';
  const newLayout = ['farm', 'vipsauna', 'expcoupon'].includes(selected);
  // 메카베리 계열(일반/크림슨)은 시뮬레이터 계산식을 공유한다
  const isMekaberryLike = selected === 'farm' && farm.sim === 'meka';

  // newLayout 4종 경험치표 props (인라인 + 모달 공용)
  const splitProps: ExpTableProps | null =
    selected === 'vipsauna' ? { title: dive.name, valueLabel: '1시간 당 경험치', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: dive.data[lv] ?? 0, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : selected === 'expcoupon' ? { title: coupon.name, valueLabel: '1000개 당 경험치', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: (coupon.data[lv] ?? 0) * 1000, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
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

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
      {/* 좌측 메뉴 (모바일/태블릿: 4열 2행 그리드 / lg(905px)~: 세로 90px 정사각형 고정) */}
      <div className="grid grid-cols-4 lg:grid-cols-1 gap-1.5 shrink-0 w-full lg:w-[90px] self-start">
        {MENU_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => setSelected(item.key)}
            className={
              'h-16 lg:h-auto lg:aspect-square rounded-lg shadow-sm text-xs font-medium transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 text-center ' +
              (selected === item.key
                ? 'bg-orange-500 text-white border border-orange-500'
                : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
            }
          >
            <img src={`/icons/${assetSlug(item.icon)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
            {item.label}
          </button>
        ))}
      </div>

      {/* 우측 콘텐츠 영역: 콜아웃(블루베리/메카베리) + 표/시뮬레이터 */}
      {/* 상단 선택 버튼 · 농장 팁 콜아웃 · 표/시뮬레이터 사이는 에픽 던전·트레져 헌터와 같은 6px */}
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
        {/* 표/시뮬레이터 (모바일/태블릿: 세로 스택, 시뮬레이터가 위로 오도록 flex-col-reverse / lg(905px)~: 좌우 배치) */}
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
              {selected === 'vipsauna' ? (
                // key = 선택한 상단 탭 → 탭을 바꾸면 시뮬레이터·목표 레벨 역산 입력값이 초기화된다
                // (같은 컴포넌트를 쓰는 메카베리↔크림슨에서 이전 표로 계산한 결과가 남는 것도 막는다)
                <VipSaunaSimulator key={dive.name} charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} expTable={dive.data} />
              ) : selected === 'expcoupon' ? (
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
      </div>

    </div>
  );
}
