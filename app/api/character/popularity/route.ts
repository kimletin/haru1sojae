import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  const ocid = req.nextUrl.searchParams.get('ocid');
  if (!ocid) {
    return NextResponse.json({ error: 'ocid가 필요합니다' }, { status: 400 });
  }

  try {
    const res = await fetchWithTimeout(
      `https://open.api.nexon.com/maplestory/v1/character/popularity?ocid=${encodeURIComponent(ocid)}`,
      { headers: { 'x-nxopen-api-key': apiKey } }
    );
    if (!res.ok) {
      return NextResponse.json({ error: '인기도 조회에 실패했습니다' }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ popularity: typeof data.popularity === 'number' ? data.popularity : null });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: 'API 응답 시간이 초과됐습니다' }, { status: 504 });
    }
    return NextResponse.json({ error: '네트워크 오류가 발생했습니다' }, { status: 500 });
  }
}
