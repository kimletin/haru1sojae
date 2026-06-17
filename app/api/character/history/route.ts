import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;
const DAYS = 7; // 오늘 1 + 과거 6일

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

  // todayOnly 모드: 오늘 데이터만 1번 호출해서 반환
  if (req.nextUrl.searchParams.get('todayOnly') === 'true') {
    try {
      const res = await fetchWithTimeout(
        `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocid)}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json([{
          date: today,
          exp: data.character_exp,
          expRate: parseFloat(data.character_exp_rate),
          level: data.character_level,
        }]);
      }
    } catch {}
    return NextResponse.json([]);
  }

  // 과거 6일 (daysAgo=1..6) + 오늘은 date 파라미터 없이 현재 데이터 조회
  const pastDates = Array.from({ length: DAYS - 1 }, (_, i) => kstDate(i + 1));

  const results: ({ date: string; exp: number; expRate: number; level: number } | null)[] = [];

  // 오늘 + 과거 6일 병렬 조회
  const allDates = [null, ...pastDates]; // null = 오늘 (date 파라미터 없음)
  const fetched = await Promise.all(
    allDates.map(async (date) => {
      const url = date
        ? `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocid)}&date=${date}`
        : `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocid)}`;
      try {
        const res = await fetchWithTimeout(url, { headers });
        if (!res.ok) return null;
        const data = await res.json();
        return { date: date ?? today, exp: data.character_exp, expRate: parseFloat(data.character_exp_rate), level: data.character_level };
      } catch {
        return null;
      }
    })
  );
  results.push(...fetched);

  // null 제거, 날짜 오름차순 정렬
  const valid = results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(valid);
}
