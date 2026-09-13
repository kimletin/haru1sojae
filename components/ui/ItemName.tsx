import { assetSlug } from '@/lib/assetSlug';

// 단계 뱃지 색 — 도착 단계 기준. 행이 0→1 / 1→2 둘뿐이라 진한 두 색만 쓴다
const STAGE_COLORS: Record<string, string> = {
  '1': 'bg-purple-600 text-white',
  '2': 'bg-purple-800 text-white',
};

const MONPARK_VARIANT_COLORS: Record<string, string> = {
  '일반':   'bg-fuchsia-400 text-white',
  '썬데이': 'bg-fuchsia-600 text-white',
  '스페셜': 'bg-fuchsia-800 text-white',
};

// 항목명(원본) → 아이콘 파일명(확장자 제외)
const ICON_MAP: Record<string, string> = {
  '추가경험치 50%': '추가 경험치 50%',
  '추가경험치 70%': '추가 경험치 70%',
  '2배 쿠폰': '경험치 2배 쿠폰',
  '3배 쿠폰': '경험치 3배 쿠폰',
  '4배 쿠폰': '경험치 4배 쿠폰',
  '소경축비': '소경축비',
  '고농축비': '고농축비',
  '부티크 사냥 칭호': '부티크 사냥 칭호',
  '혈맹의 반지': '혈맹의 반지',
  '경험치 부스트링': '경험치 부스트링',
  '정령의 펜던트': '정령의 펜던트',
  '프리미엄 모멘텀 패스': '프리미엄 모멘텀 패스',
  '프리미엄+프라임 모멘텀 패스': '프라임 모멘텀 패스',
  '마스터라벨 성장 플러스': '마스터라벨 성장 플러스',
};

const EPIC_ZONES = ['하이마운틴', '앵글러컴퍼니', '악몽선경', '아우룸 레기스'];

// 이번 패치로 추가된 상품 — 이름 뒤에 New 태그를 붙이고 효율표 행을 강조한다
const NEW_ITEMS = new Set([
  '프리미엄 모멘텀 패스',
  '프리미엄+프라임 모멘텀 패스',
]);

/** New 태그가 붙는 항목인지 (효율표 행 강조에 재사용) */
export function isNewItem(name: string): boolean {
  return NEW_ITEMS.has(name);
}

function NewBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-orange-500 text-white text-[10px] font-bold ml-0.5 shrink-0">New</span>
  );
}

// 하위 → 상위 상품으로 갈아타는 업그레이드 행: 두 아이콘을 화살표로 함께 표시
const UPGRADE_MAP: Record<string, { from: { icon: string; label: string }; to: { icon: string; label: string } }> = {
  '추가경험치 50%→70%': { from: { icon: '추가 경험치 50%', label: '추경 50%' }, to: { icon: '추가 경험치 70%', label: '추경 70%' } },
  '소경축비→고농축비': { from: { icon: '소경축비', label: '소경축비' }, to: { icon: '고농축비', label: '고농축비' } },
  '2배 쿠폰→3배 쿠폰': { from: { icon: '경험치 2배 쿠폰', label: '2배 쿠폰' }, to: { icon: '경험치 3배 쿠폰', label: '3배 쿠폰' } },
  '3배 쿠폰→4배 쿠폰': { from: { icon: '경험치 3배 쿠폰', label: '3배 쿠폰' }, to: { icon: '경험치 4배 쿠폰', label: '4배 쿠폰' } },
};

function iconFor(name: string): string | null {
  const base = name.replace(/\s*\((?:메소|메포)\)$/, '').trim();
  if (ICON_MAP[base]) return ICON_MAP[base];
  if (name.startsWith('VIP 사우나')) return 'VIP사우나';
  for (const zone of EPIC_ZONES) if (name.startsWith(zone)) return zone;
  return null;
}

// 항목명(계산 키) → 표시명 치환 (입장권 → (메포샵) 등)
const DISPLAY_NAME: Record<string, string> = {
  '프리미엄+프라임 모멘텀 패스': '프리미엄+프라임 모멘텀',
  // 계산 키(데이터 값)는 붙여 쓴 '앵글러컴퍼니' 그대로 두고 화면에서만 띄어 쓴다
  '앵글러컴퍼니': '앵글러 컴퍼니',
};

/** 표시용 라벨 변환. ItemName을 쓰지 않는 곳(입력 정보 카드 등)에서도 같은 표기를 쓰도록 export한다. */
export function displayLabel(text: string): string {
  if (DISPLAY_NAME[text]) return DISPLAY_NAME[text];
  return text
    .replace('추가경험치', '추가 경험치')
    .replace(/^(\d배 쿠폰)$/, '경험치 $1');
}

function Icon({ name }: { name: string }) {
  return <img src={`/icons/${assetSlug(name)}.png`} alt="" className="w-5 h-5 shrink-0 object-contain" />;
}

// 출발·도착을 뱃지 하나에 담는다 — '0단계 → 1단계'는 좁은 칸에서 너무 길어 줄바꿈을 유발했다
function StageBadge({ from, to }: { from: string; to: string }) {
  const cls = STAGE_COLORS[to] ?? 'bg-purple-600 text-white';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>
      {from}→{to}단계
    </span>
  );
}

export default function ItemName({ name }: { name: string }) {
  const up = UPGRADE_MAP[name];
  if (up) {
    return (
      <>
        <span className="inline-flex items-center gap-0.5">
          <Icon name={up.from.icon} />
          <span>{up.from.label}</span>
        </span>
        <span className="inline-flex items-center gap-0.5">
          <span className="mx-0.5 text-gray-400">→</span>
          <Icon name={up.to.icon} />
          <span>{up.to.label}</span>
        </span>
      </>
    );
  }

  const icon = iconFor(name);
  const iconEl = icon ? <Icon name={icon} /> : null;

  const stageMatch = name.match(/^(.*)\s+(\d)→(\d)단계$/);
  if (stageMatch) {
    return (
      <>
        <span className="inline-flex items-center gap-0.5">
          {iconEl}
          {displayLabel(stageMatch[1])}
        </span>
        <span className="inline-flex items-center gap-0.5 ml-0.5">
          <StageBadge from={stageMatch[2]} to={stageMatch[3]} />
        </span>
      </>
    );
  }

  const monparkMatch = name.match(/^몬스터파크\(([^)]*)\)\s*(.*)$/);
  if (monparkMatch) {
    const zone = monparkMatch[1];
    const variant = monparkMatch[2];
    const variantCls = MONPARK_VARIANT_COLORS[variant];
    // 선택한 지역 아이콘 + '몬파: 지역' — 어느 지역 기준 값인지 바로 보이게
    return (
      <>
        <Icon name={zone} />
        몬파: {zone}
        {variant && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-0.5 ${variantCls ?? 'bg-fuchsia-500 text-white'}`}>{variant === '스페셜' ? '스페셜썬데이' : variant}</span>
        )}
      </>
    );
  }
  if (name.includes('(메소)')) {
    return (
      <>
        {iconEl}
        {displayLabel(name.replace('(메소)', ''))}
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold ml-0.5 shrink-0">메소</span>
      </>
    );
  }
  if (name.includes('(메포)')) {
    return (
      <>
        {iconEl}
        {displayLabel(name.replace('(메포)', ''))}
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold ml-0.5 shrink-0">메포</span>
      </>
    );
  }
  return (
    <>
      {iconEl}
      {displayLabel(name)}
      {name === 'VIP 사우나' && <span className="shrink-0"> (1시간)</span>}
      {isNewItem(name) && <NewBadge />}
    </>
  );
}
