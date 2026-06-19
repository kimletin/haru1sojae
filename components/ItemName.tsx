import TooltipWrapper from '@/components/TooltipWrapper';

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
        <TooltipWrapper tip="메소" className="inline-flex items-center justify-center w-4 h-4 rounded bg-amber-500 text-white text-[10px] font-bold ml-0.5 shrink-0 cursor-default">
          M
        </TooltipWrapper>
      </>
    );
  }
  if (name.includes('(메포)')) {
    return (
      <>
        {name.replace('(메포)', '')}
        <TooltipWrapper tip="메이플포인트" className="inline-flex items-center justify-center w-4 h-4 rounded bg-red-500 text-white text-[10px] font-bold ml-0.5 shrink-0 cursor-default">
          P
        </TooltipWrapper>
      </>
    );
  }
  return <>{name}</>;
}
