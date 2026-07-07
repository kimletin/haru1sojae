import { NextRequest, NextResponse } from 'next/server';
import { CLASS_TO_RANKING } from '@/data/classRanking';

const RANK_DAYS = 7; // 랭킹 추이: 어제(1일 전) ~ 7일 전

function kstDate(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return kst.toISOString().slice(0, 10);
}

async function fetchRankOn(apiKey: string, ocid: string, date: string, extra: string, revalidate: number): Promise<number | null> {
  try {
    const url = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${date}&ocid=${encodeURIComponent(ocid)}${extra}`;
    const res = await fetch(url, { headers: { 'x-nxopen-api-key': apiKey }, next: { revalidate } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ranking?.[0]?.ranking ?? null;
  } catch { return null; }
}

// 날짜 신선도별 캐시(전 방문자 공유): 어제(1일 전, 자정~새벽 갱신 중 결측 가능)는 6시간, 2~7일 전(확정·불변)은 7일
const revalidateForDaysAgo = (daysAgo: number) => (daysAgo === 1 ? 21600 : 604800);

interface RankPoint { date: string; ranking: number | null; }

// 한 랭킹 종류(종합/월드/직업)의 7일 추이를 병렬 조회 (오래된 날 → 어제 순)
async function fetchRankHistory(apiKey: string, ocid: string, extra: string): Promise<RankPoint[]> {
  // 날짜는 await 이전에 한 번만 확정 (fetch 도중 자정 넘어가도 라벨/데이터 날짜 불일치 방지)
  const dates = Array.from({ length: RANK_DAYS }, (_, i) => ({ daysAgo: i + 1, date: kstDate(i + 1) })); // 1~7일 전
  const raw = await Promise.all(
    dates.map(({ daysAgo, date }) => fetchRankOn(apiKey, ocid, date, extra, revalidateForDaysAgo(daysAgo)))
  );
  return dates
    .map(({ date }, i) => ({ date, ranking: raw[i] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// 추이의 최신값(어제) = 정렬 후 마지막 요소
function latestRank(history: RankPoint[]): number | null {
  return history.length ? history[history.length - 1].ranking : null;
}

export async function GET(req: NextRequest) {
  const ocid = req.nextUrl.searchParams.get('ocid');
  const world = req.nextUrl.searchParams.get('world');
  const className = req.nextUrl.searchParams.get('class');

  if (!ocid) return NextResponse.json({ error: 'ocid required' }, { status: 400 });

  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API key missing' }, { status: 500 });

  const rankingClass = className ? (CLASS_TO_RANKING[className] ?? null) : null;

  const [overallHistory, worldHistory, classHistory] = await Promise.all([
    fetchRankHistory(apiKey, ocid, ''),
    world ? fetchRankHistory(apiKey, ocid, `&world_name=${encodeURIComponent(world)}`) : Promise.resolve([] as RankPoint[]),
    rankingClass ? fetchRankHistory(apiKey, ocid, `&class=${encodeURIComponent(rankingClass)}`) : Promise.resolve([] as RankPoint[]),
  ]);

  return NextResponse.json({
    overall: latestRank(overallHistory),
    world: latestRank(worldHistory),
    class: latestRank(classHistory),
    overallHistory,
    worldHistory,
    classHistory,
  });
}
