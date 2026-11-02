import type { Metadata } from 'next';
import PageClient from './PageClient';
import { routeTitle, ROUTE_DESCRIPTIONS } from '@/data/routeMeta';

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

export default function Page() {
  return <PageClient />;
}
