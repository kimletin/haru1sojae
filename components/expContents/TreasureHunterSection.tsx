'use client';
import { useState } from 'react';
import { TreasureHunterTable, TREASURE_BOX_META, TREASURE_BOXES } from '@/components/expContents/TreasureHunterTable';
import SubTabs from '@/components/expContents/SubTabs';
import type { TreasureBox } from '@/data/treasureHunter';

interface Props {
  monsterLevel: number;
  treasureBonus?: number;
  hasCharacter: boolean;
}

export default function TreasureHunterSection({ monsterLevel, treasureBonus = 0, hasCharacter }: Props) {
  const [treasureBox, setTreasureBox] = useState<TreasureBox>('폴로/프리토');
  return (
                <div className="flex flex-col gap-1.5">
                  <SubTabs
                    items={TREASURE_BOXES.map(d => ({
                      key: d,
                      // 탭엔 부제(출현 지역)만 — 박스 종류는 아이콘으로, 정식 이름은 아래 표 제목으로 보인다
                      label: TREASURE_BOX_META[d].sub,
                      icon: TREASURE_BOX_META[d].icon,
                      iconExt: 'webp' as const,
                      iconClassName: 'scale-125',
                    }))}
                    current={treasureBox}
                    onSelect={setTreasureBox}
                  />
                  <div className="flex-1 min-h-0">
                    <TreasureHunterTable
                      monsterLevel={monsterLevel}
                      treasureBonus={treasureBonus}
                      selectedBox={treasureBox}
                      hasCharacter={hasCharacter}
                    />
                  </div>
                </div>
  );
}
