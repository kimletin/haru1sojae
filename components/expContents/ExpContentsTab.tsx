'use client';

import CardHeader from '@/components/ui/CardHeader';
import SimNumInput from '@/components/expContents/SimNumInput';

import { useEffect, useState } from 'react';
import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MONSTER_PARK_EXP, getMonsterParkZone } from '@/data/monsterPark';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { BLUEBERRY_EXP } from '@/data/blueberry';
import type { SundayType } from '@/types';
import Num from '@/components/ui/Num';
import TooltipWrapper from '@/components/ui/TooltipWrapper';
import { pctNoSign, type ExpTableProps } from '@/components/expContents/shared';
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
  { key: 'treasurehunter', label: '트레져 헌터', icon: '트레져 헌터' },
  { key: 'epicdungeon', label: '에픽 던전', icon: '앵글러컴퍼니' },
  { key: 'monsterpark', label: '몬스터파크', icon: '몬스터파크' },
  { key: 'vipsauna',    label: 'VIP 사우나', icon: 'VIP사우나' },
  { key: 'expcoupon',   label: '상급 EXP 쿠폰', icon: '상급 EXP 교환권' },
  { key: 'blueberry',   label: '블루베리 농장', icon: '블루베리 농장' },
  { key: 'mekaberry',   label: '메카베리 농장', icon: '메카베리 농장' },
];

// 경험치 콘텐츠 서브탭 키 (URL 검증용)
export const CONTENT_KEYS = MENU_ITEMS.map(m => m.key);


interface Props {
  charLevel: number;
  monsterLevel: number;
  monsterParkBonus: number;
  epicDungeonBonus?: number;
  treasureBonus?: number;
  todayExpRate?: number | null;
  slotKey?: number;
  initialSelected?: string;
  hasCharacter?: boolean;
}

const SUNDAY_MULT: Record<SundayType, number> = { '일반': 1, '썬데이': 1.5, '스페셜': 4 };

export default function ExpContentsTab({ charLevel, monsterLevel, monsterParkBonus, epicDungeonBonus = 0, treasureBonus = 0, todayExpRate, slotKey, initialSelected, hasCharacter = true }: Props) {
  const myParkZone = getMonsterParkZone(charLevel);

  const [selected, setSelected] = useState(initialSelected ?? 'treasurehunter');

  useEffect(() => {
    window.history.replaceState({}, '', '/cont');
  }, []);


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

  const isEpic = selected === 'epicdungeon';
  const newLayout = ['blueberry', 'vipsauna', 'expcoupon', 'mekaberry'].includes(selected);

  // newLayout 4종 경험치표 props (인라인 + 모달 공용)
  const splitProps: ExpTableProps | null =
    selected === 'vipsauna' ? { title: 'VIP 사우나', valueLabel: '1시간 당 경험치', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: VIP_SAUNA_EXP[lv] ?? 0, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : selected === 'expcoupon' ? { title: '상급 EXP 쿠폰', valueLabel: '1000개 당 경험치', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: (SUPER_EXP_COUPON[lv] ?? 0) * 1000, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : selected === 'mekaberry' ? { title: '메카베리 농장', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.filter(lv => lv >= 280).map(lv => ({ level: lv, value: MEKABERRY_EXP[lv] ?? 0, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : selected === 'blueberry' ? { title: '블루베리 농장', headerColor: 'bg-orange-200 dark:bg-orange-900/50 border-orange-200 dark:border-orange-800', titleColor: 'text-gray-800 dark:text-zinc-100', levelLabel: '레벨', rows: LEVELS.map(lv => ({ level: lv, value: BLUEBERRY_EXP[lv] ?? 0, isMe: hasCharacter && lv === charLevel, ...commonRowProps })) }
    : null;

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
            <img src={`/icons/${encodeURIComponent(item.icon)}.png`} alt="" className="w-8 h-8 shrink-0 object-contain" />
            {item.label}
          </button>
        ))}
      </div>

      {/* 우측 콘텐츠 (모바일/태블릿: 세로 스택, 시뮬레이터가 위로 오도록 flex-col-reverse / lg(905px)~: 좌우 배치) */}
      <div className={'flex flex-1 gap-4 flex-col-reverse items-stretch lg:flex-row ' + (newLayout ? 'lg:flex-row-reverse ' + (selected === 'mekaberry' ? 'lg:items-start' : 'lg:items-stretch') : selected === 'monsterpark' ? 'lg:flex-row-reverse lg:items-stretch' : 'lg:items-stretch')}>
        {isEpic ? (
          <EpicDungeonSection charLevel={charLevel} epicDungeonBonus={epicDungeonBonus} hasCharacter={hasCharacter} />
        ) : (
          <>
            {/* 좌측 카드 */}
            <div className={(newLayout ? (selected === 'mekaberry' ? 'flex-1 ' : 'relative flex-1 ') : 'flex-1 ') + 'flex flex-col'}>
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

              {newLayout && splitProps && (
                selected === 'mekaberry'
                  ? <SingleTable {...splitProps} fillHeight={false} />
                  : <div className="lg:absolute lg:inset-0"><SingleTable {...splitProps} /></div>
              )}

              {selected === 'treasurehunter' && <TreasureHunterSection monsterLevel={monsterLevel} treasureBonus={treasureBonus} hasCharacter={hasCharacter} />}

            </div>

            {/* 시뮬레이터 카드 */}
            {selected !== 'treasurehunter' && <div className={newLayout ? 'flex-1 flex flex-col gap-4' : 'flex-1 lg:self-start flex flex-col gap-4'}>
              {selected === 'vipsauna' ? (
                <VipSaunaSimulator charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} />
              ) : selected === 'expcoupon' ? (
                <ExpCouponSimulator charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} />
              ) : selected === 'mekaberry' ? (
                <MekaberrySimulator charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} />
              ) : selected === 'blueberry' ? (
                <BlueberrySimulator charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} />
              ) : (
                <MonsterParkSimulator charLevel={charLevel} hasCharacter={hasCharacter} todayExpRate={todayExpRate} slotKey={slotKey} monsterParkBonus={monsterParkBonus} />
              )}
              </div>}
          </>
        )}
      </div>

    </div>
  );
}
