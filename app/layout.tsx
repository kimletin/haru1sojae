import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import AdSenseScript from '@/components/ui/AdSenseScript';
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
  // 서버 <title>은 꼬리표 없이(구글 검색결과용). 방문자 탭의 document.title은
  // PageClient에서 '… | 하루1소재' 꼬리표를 따로 설정한다(클라 한정).
  title: '하루1소재',
  description: '메이플스토리 경험치 효율 시뮬레이터',
  icons: { icon: '/icon.png' },
  openGraph: {
    title: '하루1소재',
    description: '메이플스토리 경험치 효율 시뮬레이터',
    siteName: '하루1소재',
    url: SITE_URL,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '하루1소재',
    description: '메이플스토리 경험치 효율 시뮬레이터',
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
