'use client';

import { useEffect, useState } from 'react';
import HomeCard from '@/components/home/HomeCard';
import EventCard from '@/components/home/EventCard';

interface NoticeItem {
  date: string;
  title: string;
  url: string;
  thumbnail?: string;
}

interface NoticeResponse {
  notice: NoticeItem[];
  update: NoticeItem[];
  event: NoticeItem[];
}

export default function HomeCardSection() {
  const [data, setData] = useState<NoticeResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/notice')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setData(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 w-[905px]">
      <HomeCard title="공지사항" entries={data?.notice ?? []} />
      <HomeCard title="업데이트" entries={data?.update ?? []} />
      <EventCard entries={data?.event ?? []} />
    </div>
  );
}
