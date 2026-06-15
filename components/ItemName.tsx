const ZONE_COLORS: Record<string, { bg: string; text: string }> = {
  '세르니움':   { bg: 'bg-yellow-400',  text: 'text-black' },
  '아르크스':   { bg: 'bg-orange-400',  text: 'text-black' },
  '오디움':     { bg: 'bg-lime-400',    text: 'text-black' },
  '도원경':     { bg: 'bg-pink-300',    text: 'text-black' },
  '아르테리아': { bg: 'bg-blue-500',    text: 'text-black' },
  '카르시온':   { bg: 'bg-blue-800',    text: 'text-black' },
  '탈라하트':   { bg: 'bg-gray-400',    text: 'text-black' },
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
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-400 text-black text-[10px] font-bold ml-1 shrink-0">M</span>
      </>
    );
  }
  if (name.includes('(메포)')) {
    return (
      <>
        {name.replace('(메포)', '')}
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-black text-[10px] font-bold ml-1 shrink-0">P</span>
      </>
    );
  }
  return <>{name}</>;
}
