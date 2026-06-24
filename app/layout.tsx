import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import './globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const viewport: Viewport = {
  width: 1280,
  initialScale: 1,
  minimumScale: 0.1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: '경험치 효율표 | 하루1소재',
  description: '메이플스토리 경험치 효율 계산기',
  icons: { icon: '/icon.png' },
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
      </body>
    </html>
  );
}
