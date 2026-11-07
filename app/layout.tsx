import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { HOME_TITLE, DEFAULT_DESCRIPTION, SITE_NAME } from '@/data/routeMeta';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 0.1,
  maximumScale: 5,
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haru1sojae.kr';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // 제목·설명의 단일 출처는 data/routeMeta.ts — 서버 <title>과 방문자 탭 제목이 같은 값을 쓴다
  title: HOME_TITLE,
  description: DEFAULT_DESCRIPTION,
  icons: { icon: '/icon.png' },
  openGraph: {
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('maple-dark-mode') === 'true') {
              document.documentElement.classList.add('dark');
            }
          } catch(e) {}
        `}} />
        {/* 넥슨 Open API Analytics */}
        <script type="text/javascript" src="https://openapi.nexon.com/js/analytics.js?app_id=301803" async></script>
      </head>
      <body className={`min-h-screen bg-gray-50 text-gray-900 antialiased font-bold overflow-x-hidden ${notoSansKR.className}`}>
        {/* ⚠️ 애드센스 로더는 여기 두지 않는다 — layout은 404(not-found)까지 감싸므로
            콘텐츠가 없는 화면에도 광고가 붙어 "게시자 콘텐츠가 없는 화면에 Google 게재 광고"
            정책 위반이 된다(2026-11 반려 사유). PageClient가 화면을 보고 조건부로 띄운다. */}
        {children}
      </body>
    </html>
  );
}
