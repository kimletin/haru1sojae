'use client';

// 퍼스널 보스 계산기 — 퍼스널 버닝 이벤트(2026-09-17 ~ 11-18) 한정. 종료 후 data/personalBoss.ts 머리말의 목록대로 함께 지운다.

import { useState } from 'react';
import CardHeader from '@/components/ui/CardHeader';
import SimNumInput from '@/components/expContents/SimNumInput';
import Num from '@/components/ui/Num';
import { calcLevelUp } from '@/components/expContents/simMath';
import { LEVEL_EXP } from '@/data/levelExp';
import {
  PERSONAL_BOSSES,
  PERSONAL_BOSS_MAX_SELECT,
  PERSONAL_BOSS_EVENT_START,
  PERSONAL_BOSS_EVENT_END,
  PERSONAL_BOSS_EXP_UNIT,
  type BossDifficulty,
  type BossDifficultyInfo,
  type PersonalBoss,
} from '@/data/personalBoss';
import type { PersonalBossSelections } from '@/types';

const CARD = 'bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-700 shadow-sm overflow-hidden flex flex-col';
const TH = 'px-2 py-1.5 text-gray-600 dark:text-zinc-400 font-bold whitespace-nowrap';
// 결과 카드의 칸 하나 — 이름(위) · 값(아래)
const STAT = 'flex flex-col gap-0.5 min-w-0';
const STAT_LABEL = 'text-xs text-gray-500 dark:text-zinc-400';

// 난이도 버튼 — 모두 같은 진한 색으로 그리고, 고르지 않은 버튼만 흐리게 (이벤트 대상 난이도만 표시)
// 파티원 스테퍼 버튼 — 1인에서 −, 최대 인원에서 +가 흐려진다.
// · 선택된 행의 주황 배경이 비치지 않게 버튼 배경은 불투명, 비활성은 안쪽 기호(span)에만 투명도를 준다(group-disabled)
// · gray-* · bg-white는 globals.css의 다크 모드 !important 덮어쓰기에 걸려 비활성 색이 무시되므로 zinc-*를 쓴다
const STEP_BTN = 'group w-5 flex items-center justify-center bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors enabled:hover:bg-zinc-200 dark:enabled:hover:bg-zinc-600 enabled:cursor-pointer';
const STEP_GLYPH = 'group-disabled:opacity-30';
const DIFF_BASE ='h-[20px] px-1.5 rounded-full border text-[10px] lg:text-[11px] font-bold whitespace-nowrap transition-colors';
const DIFF_COLOR: Record<BossDifficulty, string> = {
  EASY:    'bg-zinc-500 border-zinc-500 text-white',
  NORMAL:  'bg-cyan-500 border-cyan-500 text-white',
  HARD:    'bg-rose-500 border-rose-500 text-white',
  CHAOS:   'bg-rose-500 border-rose-500 text-white',   // 하드와 같은 급이라 같은 색
  EXTREME: 'bg-red-800 border-red-800 text-white',
};

/** 이벤트 기간의 주간 보스 초기화 횟수 — 시작일(목요일)부터 7일 간격으로 마지막 날까지 세면
 *  9/17 · 9/24 · … · 11/12 = 9주 */
const EVENT_WEEK_COUNT =
  Math.floor((Date.parse(PERSONAL_BOSS_EVENT_END) - Date.parse(PERSONAL_BOSS_EVENT_START)) / (7 * 86_400_000)) + 1;

interface Props {
  charLevel: number;
  /** 추가한 캐릭터가 있으면 레벨을 그 값으로 채운다(없으면 빈칸에서 직접 입력) */
  hasCharacter: boolean;
  /** 캐릭터별로 저장된 선택 (InputValues.personalBoss) */
  selections: PersonalBossSelections;
  onChange: (next: PersonalBossSelections) => void;
}

export default function PersonalBossTab({ charLevel, hasCharacter, selections, onChange }: Props) {
  // 레벨은 추가한 캐릭터 값으로 채우되, 직접 고치면 그 값을 쓴다(캐릭터 없이도 계산 가능).
  // 슬롯을 바꾸면 부모가 key로 새로 만들어 입력값이 초기화된다.
  const [levelOverride, setLevelOverride] = useState<string | null>(null);
  const levelStr = levelOverride ?? (hasCharacter ? String(charLevel) : '');

  // 저장된 선택 중 지금 데이터로 유효한 것만 반영(인원은 난이도 최대치 안으로)
  const rows = PERSONAL_BOSSES.map(boss => {
    const sel = selections[boss.name];
    const info = sel ? boss.difficulties.find(d => d.difficulty === sel.difficulty) : undefined;
    const party = info && sel ? Math.min(Math.max(1, Math.floor(sel.party) || 1), info.maxParty) : 0;
    // 파티원 수로 똑같이 나누고 소수점은 버린다
    const exp = info ? Math.floor((info.exp * PERSONAL_BOSS_EXP_UNIT) / party) : 0;
    return { boss, info, party, exp };
  });
  const selectedCount = rows.filter(r => r.info).length;
  const full = selectedCount >= PERSONAL_BOSS_MAX_SELECT;
  const weeklyExp = rows.reduce((sum, r) => sum + r.exp, 0);

  const startLevel = parseInt(levelStr);
  const canCalc = !!LEVEL_EXP[startLevel] && startLevel < 300 && weeklyExp > 0;

  // total만큼 얻었을 때 오르는 경험치% — 레벨업하면 넘어간 레벨마다 100%씩 더한다.
  // 현재 경험치%는 받지 않고 0%에서 시작한다: 이벤트 기간에 다른 콘텐츠로도 경험치가 오르므로
  // 도달 레벨은 맞출 수 없고, 보스 미션만의 몫(증가분)만 보여준다
  const gainOf = (total: number): number | null => {
    if (!canCalc) return null;
    const r = calcLevelUp(startLevel, 0, total);
    return r ? (r.finalLevel - startLevel) * 100 + r.finalPct : null;
  };
  const eventExp = weeklyExp * EVENT_WEEK_COUNT; // 이벤트 기간 내내 매주 같은 보스를 잡을 때
  const weeklyGain = gainOf(weeklyExp);
  const eventGain = gainOf(eventExp);

  const select = (boss: PersonalBoss, d: BossDifficultyInfo) => {
    const current = rows.find(r => r.boss === boss)?.info;
    const next = { ...selections };
    if (current?.difficulty === d.difficulty) {
      delete next[boss.name];                                         // 같은 난이도를 다시 누름 → 해제
    } else if (current) {
      const party = Math.min(selections[boss.name]?.party ?? 1, d.maxParty);
      next[boss.name] = { difficulty: d.difficulty, party };          // 난이도만 변경(개수 그대로), 인원은 새 최대치 안으로
    } else {
      if (full) return;
      next[boss.name] = { difficulty: d.difficulty, party: 1 };       // 새로 고름 → 1인부터
    }
    onChange(next);
  };

  const setParty = (boss: PersonalBoss, party: number) => {
    const sel = selections[boss.name];
    if (sel) onChange({ ...selections, [boss.name]: { ...sel, party } });
  };

  return (
    // 이벤트/컨텐츠 탭 안(좌측 메뉴 옆)이라 폭이 약 800px뿐이다.
    // PC: 보스 표(약 580px) + 오른쪽 좁은 결과 칸(200px, 스크롤해도 따라옴) / 모바일: 보스 표 아래 결과
    <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
      {/* 보스 선택 */}
      <div className={'lg:flex-1 lg:min-w-0 ' + CARD}>
        <CardHeader title={`보스 선택 (${selectedCount} / ${PERSONAL_BOSS_MAX_SELECT})`} className="shrink-0" />
        {/* 최소 폭을 두지 않고 칸 안에서 해결한다 — 파티원·경험치 칸은 폭을 고정해 선택해도 표 폭이 변하지 않게,
            난이도 버튼은 자리가 모자라면 다음 줄로. (overflow-x-auto는 아주 좁은 화면 대비용) */}
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] lg:text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-600">
                <th className={TH + ' pl-2 lg:pl-4 text-left'}>보스</th>
                <th className={TH + ' text-left'}>난이도</th>
                <th className={TH + ' w-[72px] text-center'}>파티원</th>
                <th className={TH + ' w-20 lg:w-24 pr-2 lg:pr-4 text-right'}>경험치</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ boss, info, party, exp }) => {
                // 12개를 채우면 아직 안 고른 보스는 더 고를 수 없다(고른 보스의 난이도 변경은 가능)
                const locked = full && !info;
                return (
                  <tr
                    key={boss.name}
                    className={'border-b border-gray-100 dark:border-zinc-800 ' + (info ? 'bg-orange-50 dark:bg-orange-900/20' : '')}
                  >
                    {/* 모바일은 행 위아래 여백을 넓혀(py-2) 난이도 버튼을 누를 때 옆 행이 눌리지 않게 한다.
                        globals.css가 표 칸 여백을 0.25rem !important로 고정하므로 !를 붙여야 먹는다(PC는 전역값 그대로) */}
                    <td className="pl-2 lg:pl-4 pr-2 max-lg:py-2!">
                      {/* 긴 이름(가디언 엔젤 슬라임)은 모바일에서 단어 단위로 줄바꿈, PC는 한 줄 */}
                      <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-zinc-100 break-keep lg:whitespace-nowrap">
                        <img src={`/boss/${boss.icon}.png`} alt="" className="w-6 h-6 shrink-0 object-contain rounded-md" />
                        {boss.name}
                      </div>
                    </td>
                    <td className="px-2 max-lg:py-2!">
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 lg:gap-1">
                        {boss.difficulties.map(d => {
                          const selected = info?.difficulty === d.difficulty;
                          return (
                            <button
                              key={d.difficulty}
                              type="button"
                              aria-pressed={selected}
                              disabled={locked}
                              onClick={() => select(boss, d)}
                              className={
                                DIFF_BASE + ' ' + DIFF_COLOR[d.difficulty] + ' ' +
                                (selected
                                  ? 'cursor-pointer'
                                  : locked
                                    ? 'opacity-20 cursor-not-allowed'            // 12개를 채워 더 고를 수 없음
                                    : 'opacity-40 hover:opacity-70 cursor-pointer')
                              }
                            >
                              {d.difficulty}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-1 max-lg:py-2! text-center">
                      {info ? (
                        // − / + 스테퍼. 높이는 보스 아이콘과 같은 h-6 — 선택해서 '-'가 스테퍼로 바뀌어도 행 높이가 그대로다
                        <div className="inline-flex items-stretch h-6 rounded-md border border-zinc-200 dark:border-zinc-600 overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                          <button
                            type="button"
                            aria-label={`${boss.name} 파티원 줄이기`}
                            disabled={party <= 1}
                            onClick={() => setParty(boss, party - 1)}
                            className={STEP_BTN}
                          >
                            <span className={STEP_GLYPH}>−</span>
                          </button>
                          <span
                            aria-label={`${party}인`}
                            className="min-w-[22px] px-0.5 flex items-center justify-center text-xs lg:text-sm text-zinc-800 dark:text-zinc-100 border-x border-zinc-200 dark:border-zinc-600"
                          >
                            {party}
                          </span>
                          <button
                            type="button"
                            aria-label={`${boss.name} 파티원 늘리기`}
                            disabled={party >= info.maxParty}
                            onClick={() => setParty(boss, party + 1)}
                            className={STEP_BTN}
                          >
                            <span className={STEP_GLYPH}>+</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-zinc-500">-</span>
                      )}
                    </td>
                    <td className="pl-2 pr-2 lg:pr-4 max-lg:py-2! text-right whitespace-nowrap text-gray-700 dark:text-zinc-300">
                      {info ? <Num n={exp} /> : <span className="text-gray-400 dark:text-zinc-500">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* 선택 초기화 — 보스 선택 카드 우하단 */}
        <div className="shrink-0 flex justify-end px-2 lg:px-4 py-1.5">
          <button
            type="button"
            onClick={() => onChange({})}
            disabled={selectedCount === 0}
            className="h-6 px-2.5 rounded-md border border-gray-200 dark:border-zinc-600 text-xs font-medium text-gray-600 dark:text-zinc-300 transition-colors enabled:hover:bg-gray-100 dark:enabled:hover:bg-zinc-800 enabled:cursor-pointer disabled:opacity-40"
          >
            선택 초기화
          </button>
        </div>
      </div>

      {/* 결과 — PC는 보스 표 오른쪽 좁은 칸에 한 줄씩 세로로, 모바일은 표 아래 2칸씩 */}
      <div className={'lg:w-[200px] lg:shrink-0 lg:sticky lg:top-20 ' + CARD}>
        <CardHeader title="시뮬레이터" className="shrink-0" />
        <div className="p-4 grid grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-3 text-sm text-gray-700 dark:text-zinc-300">
          {/* 현재 레벨 — 다른 시뮬레이터와 같은 입력줄(왼쪽 이름, 오른쪽 입력칸).
              추가한 캐릭터면 그 값으로 채워지고 직접 고칠 수 있다. 모바일도 한 줄 전체를 쓴다 */}
          <div className="col-span-2 lg:col-span-1 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">현재 레벨</span>
            <SimNumInput value={levelStr} onChange={setLevelOverride} unit="레벨" pad="7" max={299} />
          </div>
          {/* 입력(현재 레벨) ↔ 결과(주간·예상 총 경험치) 구분선 */}
          <div className="col-span-2 lg:col-span-1 border-t border-gray-100 dark:border-zinc-700" />
          {/* 주간 경험치 + 한 주 동안 오르는 경험치%(레벨업하면 넘어간 레벨만큼 100%씩 더함) */}
          <div className={STAT}>
            <span className={STAT_LABEL}>주간 경험치</span>
            {weeklyExp > 0 ? (
              <span>
                <span className="font-semibold"><Num n={weeklyExp} /></span>
                {weeklyGain != null && <span className="ml-1 text-orange-500">(+{weeklyGain.toFixed(3)}%)</span>}
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
          {/* 이벤트 기간(9/17 ~ 11/18) 동안 매주 같은 보스를 잡을 때의 합계 */}
          <div className={STAT}>
            <span className={STAT_LABEL}>예상 총 경험치({EVENT_WEEK_COUNT}주)</span>
            {weeklyExp > 0 ? (
              <span>
                <span className="font-semibold"><Num n={eventExp} /></span>
                {eventGain != null && <span className="ml-1 text-orange-500">(+{eventGain.toFixed(3)}%)</span>}
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
