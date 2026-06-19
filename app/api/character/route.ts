import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function nexonErrorMessage(status: number): { message: string; clientStatus: number } {
  switch (status) {
    case 400: return { message: '캐릭터를 찾을 수 없습니다. API 점검 중일 수 있습니다', clientStatus: 404 };
    case 403: return { message: 'API 키가 유효하지 않습니다', clientStatus: 500 };
    case 429: return { message: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요', clientStatus: 429 };
    case 500: return { message: 'Nexon API 서버 오류입니다. 점검 중일 수 있습니다', clientStatus: 503 };
    default:  return { message: `API 오류가 발생했습니다 (${status})`, clientStatus: 500 };
  }
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  const headers = { 'x-nxopen-api-key': apiKey };

  // ocid 직접 전달 시: 이미지만 재조회
  const ocidParam = req.nextUrl.searchParams.get('ocid');
  if (ocidParam) {
    try {
      const charRes = await fetchWithTimeout(
        `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocidParam)}`,
        { headers }
      );
      if (!charRes.ok) {
        const { message, clientStatus } = nexonErrorMessage(charRes.status);
        return NextResponse.json({ error: message }, { status: clientStatus });
      }
      const char = await charRes.json();
      return NextResponse.json({
        image: char.character_image ?? null,
        level: char.character_level ?? null,
        class: char.character_class ?? null,
        world: char.world_name ?? null,
        guild: char.character_guild_name ?? null,
      });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return NextResponse.json({ error: 'API 응답 시간이 초과됐습니다' }, { status: 504 });
      }
      return NextResponse.json({ error: '네트워크 오류가 발생했습니다' }, { status: 500 });
    }
  }

  const name = req.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: '닉네임을 입력하세요' }, { status: 400 });
  }

  try {
    const ocidRes = await fetchWithTimeout(
      `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(name)}`,
      { headers }
    );

    if (!ocidRes.ok) {
      const { message, clientStatus } = nexonErrorMessage(ocidRes.status);
      return NextResponse.json({ error: message }, { status: clientStatus });
    }

    const { ocid } = await ocidRes.json();

    const charRes = await fetchWithTimeout(
      `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`,
      { headers }
    );

    if (!charRes.ok) {
      const { message, clientStatus } = nexonErrorMessage(charRes.status);
      return NextResponse.json({ error: message }, { status: clientStatus });
    }

    const char = await charRes.json();

    return NextResponse.json({
      ocid,
      name: char.character_name,
      level: char.character_level,
      class: char.character_class,
      world: char.world_name,
      guild: char.character_guild_name ?? null,
      image: char.character_image ?? null,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: 'API 응답 시간이 초과됐습니다. 점검 중일 수 있습니다' }, { status: 504 });
    }
    return NextResponse.json({ error: '네트워크 오류가 발생했습니다' }, { status: 500 });
  }
}
