// 자산 참조 전수 검증: 런타임이 조립하는 경로를 그대로 재현해 실제 파일 존재를 확인한다.
// 실행: npx tsx scripts/verify-assets.mts   (배포 전 필수)
import fs from 'fs';
import path from 'path';
import { assetSlug } from '../lib/assetSlug';
import { HUNTING_REGIONS } from '../data/huntingGrounds';
import { getMonstersAtMap } from '../data/regionMonsters';

const ROOT = path.join(process.cwd(), 'public');
const missing = new Set<string>();
let okCount = 0;
function check(urlPath: string) {
  const file = path.join(ROOT, urlPath);
  if (fs.existsSync(file)) okCount++;
  else missing.add(urlPath);
}

// HuntingGroundTab / HuntingGroundDetailModal 의 실제 경로 조립을 그대로 재현
HUNTING_REGIONS.forEach((r, i) => {
  const regionFolder = `${i + 1}.${r.name}`;
  const folderSlug = assetSlug(regionFolder);
  check(`/icons/${assetSlug(r.name)}.png`);                       // 지역 아이콘 (사이드바)
  for (const g of r.grounds) {
    check(`/maps/${folderSlug}/${assetSlug(g.name)}.webp`);       // 맵 이미지
    // 세부 모달: getMonstersAtMap(맵이름) → mobDir=regionFolder
    const mons = getMonstersAtMap(g.name, g.mobs.map(m => m.level));
    for (const mon of mons) check(`/mobs/${folderSlug}/${assetSlug(mon.name)}.png`);
  }
});

console.log(`검증 통과 파일: ${okCount}개 존재 (지역아이콘+맵+몹)`);
if (missing.size) {
  console.log(`\n❌ 없는 파일 ${missing.size}개:`);
  for (const m of [...missing].slice(0, 40)) console.log('  ' + m);
  process.exit(1);
} else {
  console.log('✅ 사냥터 자산 전부 매칭 (누락 0)');
}
