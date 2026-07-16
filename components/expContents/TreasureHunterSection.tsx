'use client';
import { useState } from 'react';
import { TreasureHunterTable, TREASURE_BOX_META, TREASURE_BOXES } from '@/components/expContents/TreasureHunterTable';
import type { TreasureBox } from '@/data/treasureHunter';

interface Props {
  monsterLevel: number;
  treasureBonus?: number;
  hasCharacter: boolean;
}

export default function TreasureHunterSection({ monsterLevel, treasureBonus = 0, hasCharacter }: Props) {
  const [treasureBox, setTreasureBox] = useState<TreasureBox>('폴로/프리토');
  return (
                <div className="flex flex-col gap-1.5 lg:h-[664px]">
                  <div className="flex gap-1.5 shrink-0">
                    {TREASURE_BOXES.map(d => (
                      <button
                        key={d}
                        onClick={() => setTreasureBox(d)}
                        className={
                          'flex-1 rounded-lg text-sm font-medium transition-colors cursor-pointer py-2 px-2 lg:px-3 flex items-center justify-center gap-1.5 lg:gap-2 ' +
                          (treasureBox === d
                            ? 'bg-orange-500 text-white border border-orange-500'
                            : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 hover:bg-orange-50 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600')
                        }
                      >
                        <div className="w-10 h-10 lg:w-12 lg:h-12 shrink-0 flex items-center justify-center">
                          <img src={`/icons/${encodeURIComponent(TREASURE_BOX_META[d].icon)}.png`} alt="" className="w-full h-full object-contain scale-125" />
                        </div>
                        <div className="flex flex-col items-center min-w-0">
                          <div className="font-semibold whitespace-nowrap text-[12px] lg:text-sm">{TREASURE_BOX_META[d].label}</div>
                          <div className={'text-xs mt-0.5 ' + (treasureBox === d ? 'text-orange-100' : 'text-gray-400 dark:text-zinc-500')}>{TREASURE_BOX_META[d].sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
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
