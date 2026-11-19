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

/** 한 줄에서 '경험치' 뒤에 처음 오는 % 수치.
 *  한 줄에 메소 획득량 등이 함께 적혀 있어도 섞이지 않도록 '경험치'에 붙여서 찾는다.
 *  쉼표·마침표를 넘지 않으므로 같은 문장 안의 수치만 집는다. */
const EXP_PCT_AFTER = /경험치[^,.\n]*?(\d+)\s*%/;
/** 위에서 못 찾았을 때 쓰는 보루 — 그 줄의 첫 % 수치 */
const ANY_PCT = /(\d+)\s*%/;

/** 몬스터파크 보약 수치.
 *
 *  ⚠️ 정확한 문장으로 매칭하지 않는다. 인게임 문구가 계속 바뀌어서
 *     (「몬스터파크 퇴장 시 획득하는 경험치 n% 증가」 → 「몬스터파크 클리어 경험치 n% 증가」)
 *     문장을 박아두면 새 보약이 조용히 0%로 잡혔다. 그래서 '한 줄에 몬스터파크와 경험치가
 *     함께 있으면 그 줄의 경험치 %를 더한다'로 느슨하게 둔다.
 *
 *  ⚠️ 증가/감소를 가리지 않는다 — 보약으로 디버프를 주지는 않는다는 전제다.
 *     만약 제한·감소 문구가 붙은 보약이 나오면 그 수치도 그대로 더해지므로 여기를 손봐야 한다.
 *
 *  ⚠️ 한 보약이 두 문구를 같이 가지면 줄마다 더해진다(예: 퇴장 30% + 클리어 30% = 60%).
 *     같은 효과를 다르게 적은 것이라면 중복이 되니 그때는 문구를 확인하고 걸러야 한다. */
function parseMonsterParkPct(effect: string): number {
  let total = 0;
  for (const line of effect.split(/\r?\n/)) {
    if (!line.includes('몬스터파크') || !line.includes('경험치')) continue;
    const m = line.match(EXP_PCT_AFTER) ?? line.match(ANY_PCT);
    if (m) total += parseInt(m[1]);
  }
  return total;
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

    let match;
    const skillMonPark = parseMonsterParkPct(effect);
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
      { headers: { 'x-nxopen-api-key': apiKey }, next: { revalidate: 60 } }
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
