import { NextRequest, NextResponse } from 'next/server';
import { CLASS_TO_RANKING } from '@/data/classRanking';

function kstDate(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return kst.toISOString().slice(0, 10);
}

async function fetchRank(apiKey: string, ocid: string, extra: string): Promise<number | null> {
  try {
    const url = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${kstDate(1)}&ocid=${encodeURIComponent(ocid)}${extra}`;
    const res = await fetch(url, { headers: { 'x-nxopen-api-key': apiKey } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ranking?.[0]?.ranking ?? null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const ocid = req.nextUrl.searchParams.get('ocid');
  const world = req.nextUrl.searchParams.get('world');
  const className = req.nextUrl.searchParams.get('class');

  if (!ocid) return NextResponse.json({ error: 'ocid required' }, { status: 400 });

  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

  const rankingClass = className ? (CLASS_TO_RANKING[className] ?? null) : null;

  const [overall, worldRank, classRank] = await Promise.all([
    fetchRank(apiKey, ocid, ''),
    world ? fetchRank(apiKey, ocid, `&world_name=${encodeURIComponent(world)}`) : Promise.resolve(null),
    rankingClass ? fetchRank(apiKey, ocid, `&class=${encodeURIComponent(rankingClass)}`) : Promise.resolve(null),
  ]);

  return NextResponse.json({ overall, world: worldRank, class: classRank });
}
