const ZONE_COLORS: Record<string, { bg: string; text: string }> = {
  '세르니움':   { bg: 'bg-rose-500', text: 'text-white' },
  '아르크스':   { bg: 'bg-rose-500', text: 'text-white' },
  '오디움':     { bg: 'bg-rose-500', text: 'text-white' },
  '도원경':     { bg: 'bg-rose-500', text: 'text-white' },
  '아르테리아': { bg: 'bg-rose-500', text: 'text-white' },
  '카르시온':   { bg: 'bg-rose-500', text: 'text-white' },
  '탈라하트':   { bg: 'bg-rose-500', text: 'text-white' },
};

export default function ItemName({ name }: { name: string }) {
  if (name.startsWith('몬스터파크(') && name.endsWith(')')) {
    const zone = name.slice(6, -1);
    const c = ZONE_COLORS[zone];
    return (
      <>
        몬스터파크
        {c
          ? <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 ${c.bg} ${c.text}`}>{zone}</span>
          : <span className="text-gray-600 dark:text-zinc-400">({zone})</span>
        }
      </>
    );
  }
  if (name.includes('(메소)')) {
    return (
      <>
        {name.replace('(메소)', '')}
        <span className="relative group inline-flex items-center justify-center w-4 h-4 rounded bg-amber-500 text-white text-[10px] font-bold ml-0.5 shrink-0 cursor-default">
          M
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
            메소
          </span>
        </span>
      </>
    );
  }
  if (name.includes('(메포)')) {
    return (
      <>
        {name.replace('(메포)', '')}
        <span className="relative group inline-flex items-center justify-center w-4 h-4 rounded bg-red-500 text-white text-[10px] font-bold ml-0.5 shrink-0 cursor-default">
          P
          <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[11px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
            메이플포인트
          </span>
        </span>
      </>
    );
  }
  return <>{name}</>;
}
