import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export interface SkillBonusEntry { name: string; pct: number; icon: string | null; }

export interface SkillBuffResult {
  monsterParkBonus: number;
  epicDungeonBonus: number;
  monsterParkBonuses: SkillBonusEntry[];
  epicDungeonBonuses: SkillBonusEntry[];
  treasureBonus: number;
  treasureBonuses: SkillBonusEntry[];
}

function parseBonuses(skills: { skill_name: string; skill_effect: string | null; skill_icon: string | null }[]): SkillBuffResult {
  let monsterParkBonus = 0;
  let epicDungeonBonus = 0;
  let treasureBonus = 0;
  const monsterParkBonuses: SkillBonusEntry[] = [];
  const epicDungeonBonuses: SkillBonusEntry[] = [];
  const treasureBonuses: SkillBonusEntry[] = [];

  for (const skill of skills) {
    const effect = skill.skill_effect ?? '';

    const monparkRegex = /몬스터파크 퇴장 시 획득하는 경험치 (\d+)% 증가/g;
    let match;
    let skillMonPark = 0;
    while ((match = monparkRegex.exec(effect)) !== null) {
      skillMonPark += parseInt(match[1]);
    }
    if (skillMonPark > 0) {
      monsterParkBonus += skillMonPark;
      monsterParkBonuses.push({ name: skill.skill_name, pct: skillMonPark, icon: skill.skill_icon ?? null });
    }

    const epicRegex = /에픽 던전 기본 경험치 보상 획득량 (\d+)% 증가/g;
    let skillEpic = 0;
    while ((match = epicRegex.exec(effect)) !== null) {
      skillEpic += parseInt(match[1]);
    }
    if (skillEpic > 0) {
      epicDungeonBonus += skillEpic;
      epicDungeonBonuses.push({ name: skill.skill_name, pct: skillEpic, icon: skill.skill_icon ?? null });
    }

    const treasureRegex = /트레져 헌터 경험치 획득량 (\d+)% 증가/g;
    let skillTreasure = 0;
    while ((match = treasureRegex.exec(effect)) !== null) {
      skillTreasure += parseInt(match[1]);
    }
    if (skillTreasure > 0) {
      treasureBonus += skillTreasure;
      treasureBonuses.push({ name: skill.skill_name, pct: skillTreasure, icon: skill.skill_icon ?? null });
    }
  }

  return { monsterParkBonus, epicDungeonBonus, treasureBonus, monsterParkBonuses, epicDungeonBonuses, treasureBonuses };
}

export async function GET(req: NextRequest) {
  const ocid = req.nextUrl.searchParams.get('ocid');
  if (!ocid) return NextResponse.json({ error: 'ocid가 필요합니다' }, { status: 400 });

  const apiKey = process.env.NEXON_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'API 키가 설정되지 않았습니다' }, { status: 500 });

  try {
    const res = await fetchWithTimeout(
      `https://open.api.nexon.com/maplestory/v1/character/skill?ocid=${encodeURIComponent(ocid)}&character_skill_grade=0`,
      { headers: { 'x-nxopen-api-key': apiKey } }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Nexon API 오류 (${res.status})` }, { status: res.status });
    }

    const data = await res.json();
    const skills: { skill_name: string; skill_effect: string | null; skill_icon: string | null }[] = data.character_skill ?? [];
    const result: SkillBuffResult = parseBonuses(skills);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json({ error: 'API 응답 시간이 초과됐습니다' }, { status: 504 });
    }
    return NextResponse.json({ error: '네트워크 오류가 발생했습니다' }, { status: 500 });
  }
}
