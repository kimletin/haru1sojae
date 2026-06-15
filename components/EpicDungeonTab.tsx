'use client';

import { HAIMOUNTAIN, ANGLER_COMPANY, NIGHTMARE_SANCTUARY } from '@/data/epicDungeon';

function fmt(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  return n.toLocaleString('ko-KR');
}

interface TableProps {
  title: string;
  levels: number[];
  data: Record<number, { stage0: number; stage1: number; stage2: number }>;
  metacoin: { stage1: number; stage2: number };
  charLevel: number;
  color: string;
}

function DungeonTable({ title, levels, data, metacoin, charLevel, color }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className={`${color} border-b`}>
            <th className="text-left px-3 py-2" colSpan={4}>{title}</th>
          </tr>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-3 py-2">레벨</th>
            <th className="text-right px-3 py-2">0단계</th>
            <th className="text-right px-3 py-2">{metacoin.stage1.toLocaleString()}메포 (0→1)</th>
            <th className="text-right px-3 py-2">{metacoin.stage2.toLocaleString()}메포 (0→2)</th>
          </tr>
        </thead>
        <tbody>
          {levels.map(lv => {
            const d = data[lv];
            if (!d) return null;
            return (
              <tr key={lv} className={`border-b ${lv === charLevel ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                <td className="px-3 py-1.5">{lv}{lv === charLevel && ' ◀'}</td>
                <td className="px-3 py-1.5 text-right">{fmt(d.stage0)}</td>
                <td className="px-3 py-1.5 text-right">
                  {fmt(d.stage1)}
                  <span className="text-xs text-blue-500 ml-1">(+{fmt(d.stage1 - d.stage0)})</span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  {fmt(d.stage2)}
                  <span className="text-xs text-blue-500 ml-1">(+{fmt(d.stage2 - d.stage1)})</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  charLevel: number;
}

export default function EpicDungeonTab({ charLevel }: Props) {
  const allLevels = Array.from({ length: 40 }, (_, i) => i + 260);

  return (
    <div className="space-y-8">
      <DungeonTable
        title="하이마운틴 (260 레벨+)"
        levels={allLevels}
        data={HAIMOUNTAIN}
        metacoin={{ stage1: 7500, stage2: 22500 }}
        charLevel={charLevel}
        color="bg-indigo-50"
      />
      <DungeonTable
        title="앵글러컴퍼니 (270 레벨+)"
        levels={allLevels.filter(lv => lv >= 270)}
        data={ANGLER_COMPANY}
        metacoin={{ stage1: 10000, stage2: 30000 }}
        charLevel={charLevel}
        color="bg-teal-50"
      />
      <DungeonTable
        title="악몽선경 (280 레벨+)"
        levels={allLevels.filter(lv => lv >= 280)}
        data={NIGHTMARE_SANCTUARY}
        metacoin={{ stage1: 12500, stage2: 37500 }}
        charLevel={charLevel}
        color="bg-rose-50"
      />
    </div>
  );
}
