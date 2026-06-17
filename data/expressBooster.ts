import { MONSTER_EXP } from './monsterExp';

// 레벨 구간별 배율 (동렙 몬스터 경험치 기준)
function getMultiplier(lv: number): number {
  if (lv <= 264) return 192;
  if (lv <= 269) return 220.8;
  if (lv <= 279) return 268.8;
  if (lv <= 289) return 240;
  return 220.8; // 290-294
}

const MONSTERS_PER_USE = 190;

// 295 이상은 294 경험치와 동일
const exp294 = Math.round((MONSTER_EXP[294] ?? 0) * getMultiplier(294) * MONSTERS_PER_USE);

export const EXPRESS_BOOSTER_EXP: Record<number, number> = Object.fromEntries(
  Array.from({ length: 40 }, (_, i) => i + 260).map(lv => {
    if (lv >= 295) return [lv, exp294];
    const val = Math.round((MONSTER_EXP[lv] ?? 0) * getMultiplier(lv) * MONSTERS_PER_USE);
    return [lv, val];
  })
);
