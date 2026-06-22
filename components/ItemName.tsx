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

function StageBadge({ stage }: { stage: string }) {
  const cls = STAGE_COLORS[stage] ?? 'bg-purple-500 text-white';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 ${cls}`}>
      {stage}단계
    </span>
  );
}

export default function ItemName({ name }: { name: string }) {
  const stageMatch = name.match(/^(.*)\s+(\d)→(\d)단계$/);
  if (stageMatch) {
    return (
      <>
        {stageMatch[1]}
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
        {name.replace('(메소)', '')}
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500 text-white text-[10px] font-bold ml-0.5 shrink-0">메소</span>
      </>
    );
  }
  if (name.includes('(메포)')) {
    return (
      <>
        {name.replace('(메포)', '')}
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-bold ml-0.5 shrink-0">메포</span>
      </>
    );
  }
  return <>{name}</>;
}
