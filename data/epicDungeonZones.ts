// 에픽 던전 존 목록 — 존 이름 · 입장 레벨 · 경험치 배수의 단일 출처.
//
// 여기 한 곳만 고치면 아래에 모두 반영된다(예전엔 네 곳에 따로 적혀 있어 아우룸 추가 때 한 곳이 빠졌다):
//   · 캐릭터 추가 시 에픽 던전 자동 선택 (PageClient getInitialInputs)
//   · 이벤트/컨텐츠 탭 에픽 던전 버튼 · 처음 선택 (EpicDungeonSection)
//   · 캐릭터 정보 입력의 던전 버튼 · 레벨 미달 비활성 (CharacterInfoStep)
//   · 경험치 표 생성 (scripts/gen-epic-dungeon.mts)
// 새 존을 추가하면 EpicDungeonZone 타입에도 이름을 넣고, 생성 스크립트의 변수 이름 · 메포 비용을 채운 뒤
// 스크립트를 다시 돌린다. 빠뜨리면 타입 체크나 스크립트가 알려준다.
import type { EpicDungeonZone } from '@/types';

export interface EpicDungeonZoneInfo {
  zone: EpicDungeonZone;
  /** 입장 레벨 */
  minLevel: number;
  /** 기준 존(하이마운틴) 대비 경험치 배수 — 가중치가 7.875 × (2, 3, 4, 6)이라 1 : 1.5 : 2 : 3 (아우룸만 5가 아니라 6) */
  multiplier: number;
}

// 입장 레벨 오름차순
export const EPIC_DUNGEON_ZONES: EpicDungeonZoneInfo[] = [
  { zone: '하이마운틴',    minLevel: 260, multiplier: 1 },
  { zone: '앵글러컴퍼니',  minLevel: 270, multiplier: 1.5 },
  { zone: '악몽선경',      minLevel: 280, multiplier: 2 },
  { zone: '아우룸 레기스', minLevel: 290, multiplier: 3 },
];

/** 입장 가능한 가장 높은 존 (레벨이 모자라면 첫 존) */
export function getEpicDungeonZone(level: number): EpicDungeonZone {
  let zone = EPIC_DUNGEON_ZONES[0].zone;
  for (const z of EPIC_DUNGEON_ZONES) if (level >= z.minLevel) zone = z.zone;
  return zone;
}
