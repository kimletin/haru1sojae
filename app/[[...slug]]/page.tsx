import type { Metadata } from 'next';
import PageClient from './PageClient';

// 라우트별 검색결과 제목(서버 <title>) — 구글이 읽는 값. 꼬리표 없이 라벨만.
// (방문자 탭의 document.title은 PageClient에서 '… | 하루1소재' 꼬리표를 따로 설정)
// 라벨은 PageClient 탭 이름과 일치. 홈/그 외는 layout 기본 '하루1소재'. openGraph는 layout 유지.
const ROUTE_TITLES: Record<string, string> = {
  table: '경험치 효율표',
  cont: '이벤트/컨텐츠',
  exp: '경험치 정보',
  hunt: '사냥터 정보',
  info: '정보 센터',
  privacy: '개인정보처리방침',
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug?: string[] }> }
): Promise<Metadata> {
  const { slug } = await params;
  const key = slug?.[0];
  const title = key ? ROUTE_TITLES[key] : undefined;
  return title ? { title } : {};
}

export default function Page() {
  return <PageClient />;
}
