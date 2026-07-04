'use client';

// 모바일: 입력창 실제 font-size는 16px(확대 방지), scale로 시각적으로만 12px처럼 보이게 축소. 데스크톱(lg)은 원래 12px 그대로
const PAD_RIGHT: Record<string, string> = {
  '7': 'pr-[37.3333px] lg:pr-7',
  '5': 'pr-[26.6667px] lg:pr-5',
  '4': 'pr-[21.3333px] lg:pr-4',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  decimal?: boolean;
  unit?: string;
  pad?: '7' | '5' | '4';
  width?: string;
  height?: string;
  placeholder?: string;
  max?: number;
}

export default function SimNumInput({ value, onChange, decimal, unit, pad = '7', width = 'w-20', height = 'h-[24px]', placeholder = '0', max }: Props) {
  return (
    <div className={`relative flex items-center ${width} ${height} overflow-visible`}>
      <input
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={e => {
          let v = decimal
            ? e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
            : e.target.value.replace(/[^0-9]/g, '');
          if (max != null && v !== '' && !decimal) v = String(Math.min(parseInt(v), max));
          onChange(v);
        }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        placeholder={placeholder}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-75 w-[calc(100%/0.75)] h-[calc(100%/0.75)] text-[16px] text-center border-[2.6667px] border-yellow-400 dark:border-yellow-600 rounded-[5.3333px] bg-yellow-50 dark:bg-zinc-800 py-0 px-[8px] ${PAD_RIGHT[pad]} text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 lg:static lg:translate-x-0 lg:translate-y-0 lg:scale-100 lg:w-full lg:h-full lg:text-[12px] lg:border-2 lg:rounded lg:px-1.5`}
      />
      {unit && <span className="absolute right-1.5 text-[10px] text-gray-400 dark:text-zinc-500 pointer-events-none">{unit}</span>}
    </div>
  );
}
