// 에픽 던전 경험치 표 생성: data/epicDungeon.ts 를 규칙에서 찍어낸다.
// 실행: npx tsx scripts/gen-epic-dungeon.mts
//
// ── 규칙 ──
//   하이마운틴(기준) = ceil(동렙몹 경험치 × 15.75 × 9,600 / 1억) × 1억
//   앵글러컴퍼니 = 하이마운틴 × 1.5 / 악몽선경 = × 2 / 아우룸 레기스 = × 3
//   stage1 = stage0 × 5,  stage2 = stage0 × 9
//
// 올림은 하이마운틴에서 한 번만 일어나고 나머지 존은 거기에 배수를 곱한다.
// 그래서 앵글러(×1.5)만 기준값의 억 단위가 홀수일 때 5천만 단위가 나온다.
//
// 검증: 테스트월드 실측 11개 값(278·279·286·298 × 4개 존)과 정수까지 일치.
// 손으로 옮긴 옛 표에는 하이마운틴 4개(272~275) · 앵글러 8개 레벨이 틀려 있었다.
import fs from 'fs';
import path from 'path';
import { MONSTER_EXP } from '../data/monsterExp';

const UNIT = 100_000_000; // 1억 — 기준 존의 올림 단위
const BASE_WEIGHT = 15.75;
const MOB_COUNT = 9_600;

/** 기준 존(하이마운틴)의 0단계 누적 경험치 */
function baseStage0(level: number): number {
  const mob = MONSTER_EXP[level];
  if (!mob) throw new Error(`MONSTER_EXP에 Lv.${level}이 없습니다`);
  return Math.ceil((mob * BASE_WEIGHT * MOB_COUNT) / UNIT) * UNIT;
}

interface Zone {
  varName: string;
  label: string;
  multiplier: number; // 기준 존 대비
  minLevel: number;
}

// 가중치는 7.875 × (2, 3, 4, 6) — 아우룸만 5가 아니라 6이다
const ZONES: Zone[] = [
  { varName: 'HAIMOUNTAIN',         label: '하이마운틴',   multiplier: 1,   minLevel: 260 },
  { varName: 'ANGLER_COMPANY',      label: '앵글러컴퍼니', multiplier: 1.5, minLevel: 270 },
  { varName: 'NIGHTMARE_SANCTUARY', label: '악몽선경',     multiplier: 2,   minLevel: 280 },
  { varName: 'AURUM_REGIS',         label: '아우룸 레기스', multiplier: 3,   minLevel: 290 },
];

const MAX_LEVEL = 299;

function pad(n: number, width: number): string {
  return String(n).padStart(width);
}

function zoneBlock(zone: Zone): string {
  const rows: string[] = [];
  // 자릿수를 맞춰 표처럼 읽히게 한다 (옛 파일과 같은 모양)
  const widths = [0, 0, 0];
  for (let lv = zone.minLevel; lv <= MAX_LEVEL; lv++) {
    const s0 = baseStage0(lv) * zone.multiplier;
    [s0, s0 * 5, s0 * 9].forEach((v, i) => {
      widths[i] = Math.max(widths[i], String(v).length);
    });
  }
  for (let lv = zone.minLevel; lv <= MAX_LEVEL; lv++) {
    const s0 = baseStage0(lv) * zone.multiplier;
    rows.push(
      `  ${lv}: { stage0: ${pad(s0, widths[0])}, stage1: ${pad(s0 * 5, widths[1])}, stage2: ${pad(s0 * 9, widths[2])} },`,
    );
  }
  return `export const ${zone.varName}: Record<number, EpicDungeonData> = {\n${rows.join('\n')}\n};`;
}

const header = `// 에픽 던전 레벨별 누적 경험치 데이터
//
// ⚠️ 이 파일은 scripts/gen-epic-dungeon.mts 가 생성합니다. 직접 고치지 마세요.
//    값을 바꾸려면 스크립트의 규칙을 고치고 다시 실행하세요.
//
// 규칙: 하이마운틴 = ceil(동렙몹 경험치 × 15.75 × 9,600, 1억)
//       앵글러컴퍼니 = × 1.5 / 악몽선경 = × 2 / 아우룸 레기스 = × 3
//       stage1 = stage0 × 5, stage2 = stage0 × 9
//
// [0단계, 7500메포단계, 22500메포단계] (하이마운틴)
// [0단계, 10000메포단계, 30000메포단계] (앵글러컴퍼니)
// [0단계, 12500메포단계, 37500메포단계] (악몽선경)
// [0단계, 15000메포단계, 45000메포단계] (아우룸 레기스)

export interface EpicDungeonData {
  stage0: number;
  stage1: number;
  stage2: number;
}

export const DUNGEON_METACOIN: Record<string, { stage1: number; stage2: number }> = {
  하이마운틴: { stage1: 7500,  stage2: 22500 },
  앵글러컴퍼니: { stage1: 10000, stage2: 30000 },
  악몽선경:   { stage1: 12500, stage2: 37500 },
  '아우룸 레기스': { stage1: 15000, stage2: 45000 },
};`;

const out = [header, ...ZONES.map(zoneBlock)].join('\n\n') + '\n';
const target = path.join(process.cwd(), 'data', 'epicDungeon.ts');
fs.writeFileSync(target, out, 'utf8');

const total = ZONES.reduce((n, z) => n + (MAX_LEVEL - z.minLevel + 1), 0);
console.log(`생성 완료: data/epicDungeon.ts — ${ZONES.length}개 존 / ${total}개 레벨`);
for (const z of ZONES) {
  const s0 = baseStage0(298) * z.multiplier;
  console.log(`  ${z.label}: Lv.298 stage0 = ${s0.toLocaleString('ko-KR')}`);
}
