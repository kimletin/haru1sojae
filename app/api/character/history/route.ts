import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;
const DAYS = 14; // 오늘 1 + 과거 13일

function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// KST 기준 날짜 반환
function kstDate(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return kst.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const ocid = req.nextUrl.searchParams.get('ocid');
  if (!ocid) return NextResponse.json({ error: 'ocid가 필요합니다' }, { status: 400 });

  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });

  const headers = { 'x-nxopen-api-key': apiKey };
  const today = kstDate(0);

  // 오늘(현재) + 과거 6일의 character/basic 병렬 조회.
  // 오늘 호출 응답에서 표시용 기본 정보(basic)도 함께 추출해 별도 basic 호출을 없앤다.
  const allDates: (string | null)[] = [null, ...Array.from({ length: DAYS - 1 }, (_, i) => kstDate(i + 1))];
  // 날짜 신선도별 캐시(Vercel Data Cache, 전 방문자 공유):
  // - 오늘(null): 실시간 → 60초
  // - 어제(index 1): 0~새벽 갱신 중 결측 가능 → 30분으로 self-heal
  // - 2~6일 전: 확정·불변 → 7일 (다음날 어제값이 이 구간으로 흡수돼 자동 장기화)
  const revalidateFor = (i: number) => (i === 0 ? 60 : i === 1 ? 1800 : 604800);
  const raws = await Promise.all(
    allDates.map(async (date, i) => {
      const url = date
        ? `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocid)}&date=${date}`
        : `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocid)}`;
      try {
        const res = await fetchWithTimeout(url, { headers, next: { revalidate: revalidateFor(i) } });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    })
  );

  const history = raws
    .map((data, i) => data
      ? { date: allDates[i] ?? today, exp: data.character_exp, expRate: parseFloat(data.character_exp_rate), level: data.character_level }
      : null)
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 오늘(현재) 응답 = 표시용 기본 정보 소스
  const t = raws[0];
  const basic = t ? {
    image: t.character_image ?? null,
    level: t.character_level ?? null,
    class: t.character_class ?? null,
    world: t.world_name ?? null,
    guild: t.character_guild_name ?? null,
    dateCreate: t.character_date_create ?? null,
  } : null;

  return NextResponse.json({ history, basic });
}
