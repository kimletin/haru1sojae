import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: '닉네임을 입력하세요' }, { status: 400 });
  }

  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });
  }

  try {
    const ocidRes = await fetch(
      `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(name)}`,
      { headers: { 'x-nxopen-api-key': apiKey } }
    );

    if (!ocidRes.ok) {
      return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다' }, { status: 404 });
    }

    const { ocid } = await ocidRes.json();

    const charRes = await fetch(
      `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${ocid}`,
      { headers: { 'x-nxopen-api-key': apiKey } }
    );

    if (!charRes.ok) {
      return NextResponse.json({ error: '캐릭터 정보를 불러올 수 없습니다' }, { status: 500 });
    }

    const char = await charRes.json();

    return NextResponse.json({
      name: char.character_name,
      level: char.character_level,
      class: char.character_class,
      world: char.world_name,
      image: char.character_image ?? null,
    });
  } catch {
    return NextResponse.json({ error: '오류가 발생했습니다' }, { status: 500 });
  }
}
