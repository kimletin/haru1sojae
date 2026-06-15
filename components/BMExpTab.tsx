'use client';

import { VIP_SAUNA_EXP } from '@/data/vipSauna';
import { MONSTER_PARK_EXP } from '@/data/monsterPark';
import { SUPER_EXP_COUPON } from '@/data/superExpCoupon';
import { MEKABERRY_EXP } from '@/data/mekaberry';
import { EXPRESS_BOOSTER_EXP } from '@/data/expressBooster';

const LEVELS = Array.from({ length: 40 }, (_, i) => i + 260);

function fmt(n: number) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8)  return (n / 1e8).toFixed(2) + '억';
  if (n >= 1e4)  return n.toLocaleString('ko-KR');
  return n.toFixed(0);
}

interface Props {
  charLevel: number;
  monsterLevel: number;
}

export default function BMExpTab({ charLevel, monsterLevel }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* VIP 사우나 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-purple-50 border-b">
                <th className="text-left px-3 py-2" colSpan={2}>VIP 사우나 (1시간 경험치)</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">캐릭터 레벨</th>
                <th className="text-right px-3 py-2">경험치</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map(lv => (
                <tr key={lv} className={`border-b ${lv === charLevel ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-1.5">{lv}{lv === charLevel && ' ◀'}</td>
                  <td className="px-3 py-1.5 text-right">{fmt(VIP_SAUNA_EXP[lv] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 상급 EXP 쿠폰 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-green-50 border-b">
                <th className="text-left px-3 py-2" colSpan={2}>상급 EXP 쿠폰 (1개당 경험치)</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">캐릭터 레벨</th>
                <th className="text-right px-3 py-2">경험치</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map(lv => (
                <tr key={lv} className={`border-b ${lv === charLevel ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-1.5">{lv}{lv === charLevel && ' ◀'}</td>
                  <td className="px-3 py-1.5 text-right">{fmt(SUPER_EXP_COUPON[lv] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 메카베리 농장 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-red-50 border-b">
                <th className="text-left px-3 py-2" colSpan={2}>메카베리 농장 입장권 (경험치, 레벨 280+)</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">캐릭터 레벨</th>
                <th className="text-right px-3 py-2">경험치</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.filter(lv => lv >= 280).map(lv => (
                <tr key={lv} className={`border-b ${lv === charLevel ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-1.5">{lv}{lv === charLevel && ' ◀'}</td>
                  <td className="px-3 py-1.5 text-right">{fmt(MEKABERRY_EXP[lv] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 익스프레스 부스터 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-50 border-b">
                <th className="text-left px-3 py-2" colSpan={2}>익스프레스 부스터 (몬스터 레벨별 경험치)</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-3 py-2">몬스터 레벨</th>
                <th className="text-right px-3 py-2">경험치</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map(lv => (
                <tr key={lv} className={`border-b ${lv === monsterLevel ? 'bg-yellow-50 font-semibold' : 'hover:bg-gray-50'}`}>
                  <td className="px-3 py-1.5">{lv}{lv === monsterLevel && ' ◀'}</td>
                  <td className="px-3 py-1.5 text-right">{fmt(EXPRESS_BOOSTER_EXP[lv] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 몬스터파크 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-orange-50 border-b">
              <th className="text-left px-3 py-2" colSpan={2}>몬스터파크 구역별 경험치</th>
            </tr>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-3 py-2">구역</th>
              <th className="text-right px-3 py-2">경험치</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(MONSTER_PARK_EXP).map(([zone, exp]) => (
              <tr key={zone} className="border-b hover:bg-gray-50">
                <td className="px-3 py-1.5">{zone}</td>
                <td className="px-3 py-1.5 text-right">{fmt(exp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
