export interface UpdateEntry {
  date: string;
  title: string;
  items?: string[];
}

export const UPDATES: UpdateEntry[] = [
  {
    date: '2026.07.16.',
    title: 'KMST ver.1.2.204 업데이트',
    items: [
      '메포샵 메카베리 농장, 블루베리 농장 입장권 추가',
      '프라임 모멘텀 패스 추가',
    ],
  },
  {
    date: '2026.06.18.',
    title: 'KMS ver.1.2.416 업데이트',
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
