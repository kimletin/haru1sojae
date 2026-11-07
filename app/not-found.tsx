import type { Metadata } from 'next';
import PageClient from './[[...slug]]/PageClient';
import { NOT_FOUND_TITLE } from '@/data/routeMeta';

export const metadata: Metadata = {
  title: NOT_FOUND_TITLE,
  robots: { index: false, follow: false },
};

/** HTTP 404 화면. `app/[[...slug]]/page.tsx`가 없는 주소에 `notFound()`를 부르면 여기가 뜬다.
 *
 *  내용은 PageClient에 맡긴다 — 헤더·메뉴·푸터를 그대로 두고 본문만 404로 보여주기 위해서다.
 *  PageClient는 마운트할 때 주소를 보고 스스로 `notFound` 상태가 되며, 그 상태에서는
 *  캐릭터 조회도 건너뛰고 광고(`showAds`)도 띄우지 않는다. */
export default function NotFound() {
  return <PageClient />;
}
