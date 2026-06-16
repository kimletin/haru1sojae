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
  title: '경험치 효율표 | MaplEFF',
  description: '메이플스토리 경험치 효율 계산기',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`min-h-screen bg-gray-50 text-gray-900 antialiased font-bold ${notoSansKR.className}`}>
        {children}
      </body>
    </html>
  );
}
