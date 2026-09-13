// 몬스터파크 구역별 기본 경험치
export const MONSTER_PARK_EXP: Record<string, number> = {
  세르니움: 37474604460,
  아르크스:  44435446300,
  오디움:    52818835200,
  도원경:    76639838000,
  아르테리아: 107204032000,
  카르시온:  156017856000,
  탈라하트:  218575316000,
  기어드락:  316934208200,
};

// 몬스터파크 구역별 입장 최소 레벨 (선택 UI/기본값 공용)
export const MONSTER_PARK_ZONES: { zone: string; minLevel: number }[] = [
  { zone: '세르니움',   minLevel: 260 },
  { zone: '아르크스',   minLevel: 265 },
  { zone: '오디움',     minLevel: 270 },
  { zone: '도원경',     minLevel: 275 },
  { zone: '아르테리아', minLevel: 280 },
  { zone: '카르시온',   minLevel: 285 },
  { zone: '탈라하트',   minLevel: 290 },
  { zone: '기어드락',   minLevel: 295 },
];

// 캐릭터 레벨별 몬스터파크 구역 결정
// MONSTER_PARK_ZONES(오름차순)에서 파생한다. 예전엔 레벨 사다리를 여기에 따로 적어뒀는데,
// 지역이 늘어날 때 배열만 고치고 이 함수를 빠뜨려 새 지역이 선택되지 않는 일이 있었다.
export function getMonsterParkZone(charLevel: number): string {
  let zone = MONSTER_PARK_ZONES[0].zone;
  for (const z of MONSTER_PARK_ZONES) {
    if (charLevel >= z.minLevel) zone = z.zone;
  }
  return zone;
}
