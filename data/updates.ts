export interface UpdateEntry {
  date: string;
  title: string;
  items?: string[];
}

export const UPDATES: UpdateEntry[] = [
  {
    date: '2026.07.17.',
    title: '오류 수정',
    items: [
      '트레져 헌터 경험치 %가 선택된 캐릭터 슬롯에 따라 다르게 표시되던 오류 수정',
    ],
  },
  {
    date: '2026.07.16.',
    title: '가성비 표시 개선',
    items: [
      '경험치 쿠폰 업그레이드 비교 추가',
      '상위 아이템 가성비가 더 좋은 경우, 업그레이드 대신 상위 아이템 단일 가성비로 표시',
    ],
  },
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
