import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

/** 마스터라벨 최대 착용 부위 수 */
const MASTER_LABEL_MAX = 5;

function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

interface CashItem {
  cash_item_label: string | null;
  date_option_expire: string | null;
}

/** 능력치 유효 기간이 남아 있는지.
 *  마스터라벨의 능력치는 항상 기간제라, 만료일을 확인할 수 없으면(null·파싱 실패) 인정하지 않는다.
 *  "유효 기간이 남은 것만" 세야 하므로 판정 불가는 제외하는 쪽(fail-closed)이 맞다. */
function optionAlive(dateOptionExpire: string | null): boolean {
  if (!dateOptionExpire) return false;
  const t = Date.parse(dateOptionExpire);
  return !Number.isNaN(t) && t > Date.now();
}

/** 착용 중(cash_item_equipment_base)인 마스터라벨 개수.
 *  아이템명은 코디마다 달라서(예: "심연의 계율") cash_item_label로 판정한다.
 *  마스터라벨 플러스는 "능력치 유효 기간이 만료되지 않은" 것만 인정하므로 만료분은 제외. */
function countMasterLabel(items: CashItem[]): number {
  const n = items.filter(it => it.cash_item_label === '마스터라벨' && optionAlive(it.date_option_expire)).length;
  return Math.min(n, MASTER_LABEL_MAX);
}

export async function GET(req: NextRequest) {
  const ocid = req.nextUrl.searchParams.get('ocid');
  if (!ocid) return NextResponse.json({ error: 'ocid가 필요합니다' }, { status: 400 });

  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });

  try {
    const res = await fetchWithTimeout(
      `https://open.api.nexon.com/maplestory/v1/character/cashitem-equipment?ocid=${encodeURIComponent(ocid)}`,
      { headers: { 'x-nxopen-api-key': apiKey }, next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Nexon API 오류 (${res.status})` }, { status: res.status });
    }

    const data = await res.json();
    const base: CashItem[] = data.cash_item_equipment_base ?? [];
    return NextResponse.json({ masterLabelCount: countMasterLabel(base) });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: 'API 응답 시간이 초과됐습니다' }, { status: 504 });
    }
    return NextResponse.json({ error: '네트워크 오류가 발생했습니다' }, { status: 500 });
  }
}
