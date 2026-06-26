import { NextResponse } from 'next/server';

// NEXON 메이플 Open API 공지 계열. 표시용(제목/날짜/링크)만 추출 → 본문 미저장(약관 안전).
const ENDPOINTS = [
  { id: 'notice', url: 'https://open.api.nexon.com/maplestory/v1/notice', listKey: 'notice' },
  { id: 'update', url: 'https://open.api.nexon.com/maplestory/v1/notice-update', listKey: 'update_notice' },
  { id: 'event', url: 'https://open.api.nexon.com/maplestory/v1/notice-event', listKey: 'event_notice' },
] as const;

const MAX_ITEMS = 15;

interface NexonNotice {
  title?: string;
  url?: string;
  date?: string;
  thumbnail_url?: string;
}

// '2026-06-26T14:00+09:00' → '2026.06.26.'
function formatDate(iso: string): string {
  const parts = iso.slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[0]}.${parts[1]}.${parts[2]}.` : iso;
}

async function fetchNotice(url: string, listKey: string, apiKey: string) {
  try {
    // next.revalidate로 Vercel Data Cache에 30분 캐시 → 방문자 수와 무관하게 호출 고정.
    const res = await fetch(url, {
      headers: { 'x-nxopen-api-key': apiKey },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list: NexonNotice[] = Array.isArray(json?.[listKey]) ? json[listKey] : [];
    return list.slice(0, MAX_ITEMS).map((it) => ({
      title: it.title ?? '',
      url: it.url ?? '',
      date: formatDate(it.date ?? ''),
      thumbnail: it.thumbnail_url ?? '',
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ notice: [], update: [], event: [] });
  }

  const [notice, update, event] = await Promise.all(
    ENDPOINTS.map((e) => fetchNotice(e.url, e.listKey, apiKey))
  );

  return NextResponse.json({ notice, update, event });
}
