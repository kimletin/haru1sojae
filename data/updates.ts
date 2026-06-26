export interface UpdateEntry {
  date: string;
  title: string;
  items?: string[];
}

export const UPDATES: UpdateEntry[] = [
  {
    date: '2026.06.18.',
    title: 'ver.1.2.416 업데이트',
    items: [
      'Lv.295-299 구간 메카베리 농장, VIP 사우나 경험치 업데이트',
      '블루베리 농장 추가',
    ],
  },
  {
    date: '2026.06.15.',
    title: '하루1소재 오픈',
    items: ['하루1소재 오픈'],
  },
];
