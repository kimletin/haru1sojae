import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = '하루1소재 — 메이플스토리 경험치 효율 시뮬레이터';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// 렌더에 쓰는 한글 글자 전부. Google Fonts에서 이 글자들만 서브셋해 받아온다.
const FONT_TEXT = '하루1소재메이플스토리경험치효율시뮬레이터';

// 구형 UA로 요청하면 woff2 대신 truetype(ttf) URL을 돌려준다(Satori는 woff2 미지원).
async function loadKoreanFont(weight: number): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(FONT_TEXT)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/4.0' } })).text();
  const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/);
  if (!src) throw new Error('한글 폰트 URL 파싱 실패');
  const res = await fetch(src[1]);
  return res.arrayBuffer();
}

export default async function Image() {
  const [iconData, bold, medium] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'icon.png')),
    loadKoreanFont(700),
    loadKoreanFont(500),
  ]);
  const iconSrc = `data:image/png;base64,${iconData.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 56,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={260} height={260} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 132, fontWeight: 700 }}>
            <div style={{ color: '#ffffff' }}>하루</div>
            <div style={{ color: '#f97316' }}>1소재</div>
          </div>
          <div style={{ fontSize: 46, fontWeight: 500, color: '#cfcfcf', marginTop: 14 }}>
            메이플스토리 경험치 효율 시뮬레이터
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Noto Sans KR', data: bold, style: 'normal', weight: 700 },
        { name: 'Noto Sans KR', data: medium, style: 'normal', weight: 500 },
      ],
    }
  );
}
