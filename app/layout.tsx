import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '경험치 BM 효율표',
  description: '메이플스토리 경험치 BM 가성비 계산기 by 레틴/매화잔해',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
