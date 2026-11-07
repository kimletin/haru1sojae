import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageClient from './PageClient';
import { routeTitle, ROUTE_DESCRIPTIONS } from '@/data/routeMeta';
import { CONTENT_KEYS } from '@/data/contentMenu';

// 탭 주소. '이벤트/컨텐츠'(cont)만 하위 경로 /cont/<메뉴 키>를 추가로 허용한다.
const TAB_SLUGS = ['table', 'cont', 'exp', 'hunt', 'info', 'privacy'];

/** 서버에서 주소의 유효성을 본다. 없는 주소는 진짜 404(HTTP 404 + app/not-found.tsx)로 보낸다.
 *  ⚠️ 예전엔 모든 경로가 200을 반환하고 PageClient가 404 화면을 그렸다. 그러면 크롤러는
 *     "정상 페이지"로 보고(소프트 404), 그 화면에도 광고가 붙어 애드센스 정책에 걸린다. */
function isValidRoute(slug?: string[]): boolean {
  if (!slug || slug.length === 0) return true;         // 홈
  if (!TAB_SLUGS.includes(slug[0])) return false;
  if (slug.length === 1) return true;
  if (slug.length === 2 && slug[0] === 'cont') return CONTENT_KEYS.includes(slug[1]);
  return false;
}

// 제목·설명은 data/routeMeta.ts가 단일 출처다 — PageClient의 document.title도 같은 값을 쓴다.
// (사유는 그 파일 머리말 참고: 서버/클라 제목을 나누면 구글이 클라 값을 읽어 키워드가 지워진다)
export async function generateMetadata(
  { params }: { params: Promise<{ slug?: string[] }> }
): Promise<Metadata> {
  const { slug } = await params;
  const key = slug?.[0];
  // /cont/<키>처럼 하위 경로도 각각 고유 주소라 그대로 canonical로 쓴다
  const path = slug?.length ? '/' + slug.join('/') : '/';

  const title = routeTitle(key);
  const description = key ? ROUTE_DESCRIPTIONS[key] : undefined;

  return {
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    alternates: { canonical: path },
  };
}

export default async function Page(
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  if (!isValidRoute(slug)) notFound();
  return <PageClient />;
}
