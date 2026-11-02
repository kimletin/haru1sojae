import { UPDATES } from '@/data/updates';
import { NOTICES } from '@/data/notices';

// 두 데이터의 날짜 표기가 다르다('2026.10.15.' vs '2026-11-02') — 정렬용 'YYYY-MM-DD'로 맞춘다
const sortKey = (date: string) => date.replace(/\./g, '-').replace(/-+$/, '');
const fmtDate = (date: string) => sortKey(date).replace(/-/g, '.') + '.';

type Row = { date: string; title: string; items?: string[]; notice?: boolean };

// 패치노트와 운영 공지를 한 타임라인에 섞어 보여준다. 데이터는 각자 파일에 그대로 두고 화면에서만 합친다.
// 공지는 만료돼도(홈 띠에서 내려가도) 여기엔 계속 남아 이력이 된다.
const ROWS: Row[] = [
  ...UPDATES.map(u => ({ date: u.date, title: u.title, items: u.items })),
  ...NOTICES.map(n => ({ date: n.date, title: n.text, notice: true })),
].sort((a, b) => sortKey(b.date).localeCompare(sortKey(a.date)));

export default function UpdateTimeline() {
  return (
    <div className="space-y-6 text-left">
      {ROWS.map((entry, i) => (
        <div key={i} className="relative pl-7">
          {i < ROWS.length - 1 && (
            <div className="absolute left-[6px] top-4 bottom-[-24px] w-0.5 bg-gray-200 dark:bg-zinc-700" />
          )}
          <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900" />
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-600 rounded-full px-2 py-0.5 whitespace-nowrap">{fmtDate(entry.date)}</span>
            {entry.notice && (
              <span className="text-xs font-semibold text-white bg-orange-500 rounded-full px-2 py-0.5 whitespace-nowrap">공지</span>
            )}
            <span className="text-sm font-bold text-gray-900 dark:text-zinc-100">{entry.title}</span>
          </div>
          {entry.items && (
            <ul className="mt-1 space-y-0.5">
              {entry.items.map((item, j) => (
                <li key={j} className="text-sm text-gray-600 dark:text-zinc-400 flex gap-1.5">
                  <span className="shrink-0">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
