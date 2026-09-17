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

// 마지막으로 정상 수신한 공지(제목·날짜·링크·썸네일만 — 서버 캐시와 같은 범위, 본문 없음)
const NOTICE_CACHE_KEY = 'haru1sojae-notice-cache';

function readCachedNotice(): NoticeResponse | null {
  try {
    const raw = localStorage.getItem(NOTICE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.notice) && Array.isArray(parsed?.update) && Array.isArray(parsed?.event)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export default function HomeCardSection() {
  const [data, setData] = useState<NoticeResponse | null>(null);
  // 새 데이터도 저장본도 없을 때만 true. 불러오는 중에는 false라 안내 문구가 깜빡이지 않는다.
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    let cached: NoticeResponse | null = null;

    Promise.resolve()
      // 1) 저장본을 먼저 보여준다 — 넥슨 API 점검으로 새 요청이 실패해도 카드가 비지 않게.
      //    서버의 CDN 대비책(503 no-store + stale-if-error)은 배포 직후 캐시가 비면 동작하지 않는다.
      //    (effect 본문에서 바로 setState하면 연쇄 렌더가 생겨 체인 첫 단계로 넘긴다 — 네트워크 응답보다 항상 먼저 실행)
      .then(() => {
        cached = readCachedNotice();
        if (alive && cached) setData(cached);
        return fetch('/api/notice');
      })
      // 2) 새로 받으면 교체·저장, 실패하면 저장본 유지. 저장본도 없으면 안내 문구를 띄운다.
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NoticeResponse | null) => {
        if (!alive) return;
        if (d) {
          setData(d);
          try {
            localStorage.setItem(NOTICE_CACHE_KEY, JSON.stringify(d));
          } catch {}
        } else if (!cached) {
          setFailed(true);
        }
      })
      .catch(() => {
        if (alive && !cached) setFailed(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-[905px]">
      <HomeCard title="공지사항" entries={data?.notice ?? []} failed={failed} />
      <HomeCard title="업데이트" entries={data?.update ?? []} failed={failed} />
      <EventCard entries={data?.event ?? []} failed={failed} />
    </div>
  );
}
