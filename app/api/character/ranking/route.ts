import { NextRequest, NextResponse } from 'next/server';
import { CLASS_TO_RANKING } from '@/data/classRanking';

const RANK_DAYS = 7; // 화면에 보여줄 추이 일수

function kstDate(daysAgo: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  return kst.toISOString().slice(0, 10);
}

async function fetchRankOn(apiKey: string, ocid: string, date: string, extra: string, cacheInit: RequestInit): Promise<number | null> {
  try {
    const url = `https://open.api.nexon.com/maplestory/v1/ranking/overall?date=${date}&ocid=${encodeURIComponent(ocid)}${extra}`;
    const res = await fetch(url, { headers: { 'x-nxopen-api-key': apiKey }, ...cacheInit });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ranking?.[0]?.ranking ?? null;
  } catch { return null; }
}

// 날짜 신선도별 캐시(전 방문자 공유)
// - 오늘: no-store. revalidate는 만료 후 첫 요청에 옛 값을 먼저 내주는 stale-while-revalidate라
//   실시간성이 필요한 오늘 자에는 쓰지 않는다 (history 라우트와 같은 이유)
// - 어제: 자정~새벽 갱신 중 결측 가능 → 30분으로 self-heal
// - 2일 전 이상: 확정·불변 → 7일
const cacheForDaysAgo = (daysAgo: number): RequestInit =>
  daysAgo === 0 ? { cache: 'no-store' } : { next: { revalidate: daysAgo === 1 ? 1800 : 604800 } };

interface RankPoint { date: string; ranking: number | null; }

// 한 랭킹 종류(종합/월드/직업)의 추이를 병렬 조회 (오래된 날 → 최신 순).
//
// D-0 ~ D-7 여덟 날을 받아 그중 7일만 돌려준다. 랭킹은 일자별로 확정되는 값이라 자정 직후에는
// 오늘 자가 아직 없는데, 그대로 내보내면 그래프 오른쪽 끝이 매일 몇 시간씩 빈 칸으로 보인다.
//   - 오늘 값 없음 → D-7 ~ D-1 (어제까지)
//   - 오늘 값 있음 → D-6 ~ D-0 (창이 한 칸 밀림)
// 어느 쪽이든 점은 항상 7개라 그래프 폭이 흔들리지 않는다.
async function fetchRankHistory(apiKey: string, ocid: string, extra: string): Promise<RankPoint[]> {
  // 날짜는 await 이전에 한 번만 확정 (fetch 도중 자정 넘어가도 라벨/데이터 날짜 불일치 방지)
  const dates = Array.from({ length: RANK_DAYS + 1 }, (_, i) => ({ daysAgo: i, date: kstDate(i) })); // D-0 ~ D-7
  const raw = await Promise.all(
    dates.map(({ daysAgo, date }) => fetchRankOn(apiKey, ocid, date, extra, cacheForDaysAgo(daysAgo)))
  );
  const points = dates
    .map(({ date }, i) => ({ date, ranking: raw[i] }))
    .sort((a, b) => a.date.localeCompare(b.date)); // D-7 → D-0
  const hasToday = points[points.length - 1].ranking != null;
  return hasToday ? points.slice(1) : points.slice(0, RANK_DAYS);
}

// 추이의 최신값 — 뒤에서부터 첫 non-null.
// 랭킹은 일자별로 확정되는 값이라 오늘 자가 아직 없을 수 있는데, 그때 마지막 요소를 그대로 쓰면
// 어제 순위가 있는데도 "-"로 표시된다.
function latestRank(history: RankPoint[]): number | null {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].ranking != null) return history[i].ranking;
  }
  return null;
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
