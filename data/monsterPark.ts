// 몬스터파크 구역별 기본 경험치
export const MONSTER_PARK_EXP: Record<string, number> = {
  세르니움: 37474604460,
  아르크스:  44435446300,
  오디움:    52818835200,
  도원경:    76639838000,
  아르테리아: 107204032000,
  카르시온:  156017856000,
  탈라하트:  218575316000,
};

// 캐릭터 레벨별 몬스터파크 구역 결정
export function getMonsterParkZone(charLevel: number): string {
  if (charLevel >= 290) return '탈라하트';
  if (charLevel >= 285) return '카르시온';
  if (charLevel >= 280) return '아르테리아';
  if (charLevel >= 275) return '도원경';
  if (charLevel >= 270) return '오디움';
  if (charLevel >= 265) return '아르크스';
  return '세르니움';
}
