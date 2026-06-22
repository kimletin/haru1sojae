const ZONE_COLORS: Record<string, { bg: string; text: string }> = {
  '세르니움':   { bg: 'bg-slate-500', text: 'text-white' },
  '아르크스':   { bg: 'bg-slate-500', text: 'text-white' },
  '오디움':     { bg: 'bg-slate-500', text: 'text-white' },
  '도원경':     { bg: 'bg-slate-500', text: 'text-white' },
  '아르테리아': { bg: 'bg-slate-500', text: 'text-white' },
  '카르시온':   { bg: 'bg-slate-500', text: 'text-white' },
  '탈라하트':   { bg: 'bg-slate-500', text: 'text-white' },
};

export default function ItemName({ name }: { name: string }) {
  const monparkMatch = name.match(/^몬스터파크\(([^)]*)\)\s*(.*)$/);
  if (monparkMatch) {
    const zone = monparkMatch[1];
    const variant = monparkMatch[2];
    const c = ZONE_COLORS[zone];
    return (
      <>
        몬스터파크
        {c
          ? <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 ${c.bg} ${c.text}`}>{zone}</span>
          : <span className="text-gray-600 dark:text-zinc-400">({zone})</span>
        }
        {variant && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 text-white ${
            variant === '스페셜' ? 'bg-amber-500' : variant === '썬데이' ? 'bg-violet-500' : 'bg-blue-500'
          }`}>{variant}</span>
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
