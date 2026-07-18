import { ASSET_SLUGS } from '@/data/assetSlugs';

// 한글 자산 이름 → public/ 의 ASCII 파일 슬러그.
// Cloudflare Workers Assets가 한글·공백 파일명을 못 올려서(매니페스트 URI 인코딩 요구) 도입.
// 과거엔 src={`/icons/${encodeURIComponent(한글)}.png`} 였고, 파일은 한글명 그대로였다.
// 이제 파일은 ASSET_SLUGS 슬러그로 개명돼 있고 URL도 이 슬러그를 쓴다.
// 테이블에 없으면 원래 이름을 반환(누락 시 개발 중 깨져 보여 바로 감지됨).
export function assetSlug(name: string): string {
  return ASSET_SLUGS[name] ?? name;
}
