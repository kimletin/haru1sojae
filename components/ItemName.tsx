const STAGE_COLORS: Record<string, string> = {
  '0': 'bg-purple-400 text-white',
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
  '2배 쿠폰': '경험치 2배 쿠폰',
  '3배 쿠폰': '경험치 3배 쿠폰',
  '4배 쿠폰': '경험치 4배 쿠폰',
  '소경축비': '소경축비',
  '아즈모스 영약': '아즈모스 영약',
  '부티크 사냥 칭호': '부티크 사냥 칭호',
  '혈맹의 반지': '혈맹의 반지',
  '경험치 부스트링': '경험치 부스트링',
  '정령의 펜던트': '정령의 펜던트',
};

const EPIC_ZONES = ['하이마운틴', '앵글러컴퍼니', '악몽선경'];

// 하위 → 상위 상품으로 갈아타는 업그레이드 행: 두 아이콘을 화살표로 함께 표시
const UPGRADE_MAP: Record<string, { from: { icon: string; label: string }; to: { icon: string; label: string } }> = {
  '추가경험치 50%→70%': { from: { icon: '추가 경험치 50%', label: '추경 50%' }, to: { icon: '추가 경험치 70%', label: '70%' } },
  '소경축비→고농축비': { from: { icon: '소경축비', label: '소경축비' }, to: { icon: '고농축비', label: '고농축비' } },
};

function iconFor(name: string): string | null {
  const base = name.replace(/\s*\((?:메소|메포)\)$/, '').trim();
  if (ICON_MAP[base]) return ICON_MAP[base];
  if (name.startsWith('몬스터파크')) return '몬스터파크';
  if (name.startsWith('VIP 사우나')) return 'VIP사우나';
  for (const zone of EPIC_ZONES) if (name.startsWith(zone)) return zone;
  return null;
}

// 표시용 라벨 변환(축약어)
function displayLabel(text: string): string {
  return text.replace('추가경험치', '추경').replace('경험치 부스트링', '부스트 링');
}

function Icon({ name }: { name: string }) {
  return <img src={`/icons/${encodeURIComponent(name)}.png`} alt="" className="w-5 h-5 shrink-0 object-contain" />;
}

function StageBadge({ stage }: { stage: string }) {
  const cls = STAGE_COLORS[stage] ?? 'bg-purple-500 text-white';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 ${cls}`}>
      {stage}단계
    </span>
  );
}

export default function ItemName({ name }: { name: string }) {
  const up = UPGRADE_MAP[name];
  if (up) {
    return (
      <>
        <Icon name={up.from.icon} />
        <span>{up.from.label}</span>
        <span className="mx-0.5 text-gray-400">→</span>
        <Icon name={up.to.icon} />
        <span>{up.to.label}</span>
      </>
    );
  }

  const icon = iconFor(name);
  const iconEl = icon ? <Icon name={icon} /> : null;

  const stageMatch = name.match(/^(.*)\s+(\d)→(\d)단계$/);
  if (stageMatch) {
    return (
      <>
        {iconEl}
        {displayLabel(stageMatch[1])}
        <StageBadge stage={stageMatch[2]} />
        <span className="mx-0.5 text-gray-400">→</span>
        <StageBadge stage={stageMatch[3]} />
      </>
    );
  }

  const monparkMatch = name.match(/^몬스터파크\(([^)]*)\)\s*(.*)$/);
  if (monparkMatch) {
    const variant = monparkMatch[2];
    const variantCls = MONPARK_VARIANT_COLORS[variant];
    return (
      <>
        {iconEl}
        몬스터파크
        {variant && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 ${variantCls ?? 'bg-fuchsia-500 text-white'}`}>{variant}</span>
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
  return <>{iconEl}{displayLabel(name)}</>;
}
