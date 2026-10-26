import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 같은 네트워크의 폰 등에서 dev 서버에 접속하기 위한 허용 호스트(개발 전용).
  // IP가 DHCP로 바뀌어도 되도록 마지막 자리는 와일드카드. '*'는 한 칸만 대신한다.
  allowedDevOrigins: ['172.30.1.*', '192.168.0.*', '192.168.1.*'],
  // 정적 이미지 캐시. Vercel 기본값(max-age=0)은 매 로드마다 재검증 요청을 보내므로 1주로 늘린다.
  // immutable은 일부러 뺐다 — 같은 파일명으로 이미지를 교체해도 최대 1주 뒤 자동 반영된다.
  async headers() {
    return [
      {
        source: '/:dir(icons|main|maps|mobs|worlds|boss)/:file*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
