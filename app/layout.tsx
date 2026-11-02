import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import AdSenseScript from '@/components/ui/AdSenseScript';
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
        {children}
        {/* 애드센스 로더 — hydration 후 <head>에 직접 주입 (사유는 컴포넌트 주석 참고) */}
        <AdSenseScript />
      </body>
    </html>
  );
}
