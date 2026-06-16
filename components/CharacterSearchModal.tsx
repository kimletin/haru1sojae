'use client';

import { useState } from 'react';

export interface CharacterInfo {
  name: string;
  level: number;
  class: string;
  world: string;
  image?: string | null;
}

interface Props {
  onConfirm: (info: CharacterInfo) => void;
  onClose: () => void;
  onSkip?: () => void;
}

export default function CharacterSearchModal({ onConfirm, onClose, onSkip }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CharacterInfo | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/character?name=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다');
      } else {
        setResult(data);
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-80">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">캐릭터 검색</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
            title="닫기"
          >
            ×
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mb-4">닉네임으로 레벨을 자동으로 불러옵니다</p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="닉네임 입력"
            value={query}
            autoFocus
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            className="flex-1 min-w-0 border border-gray-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            {loading ? '...' : '검색'}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {result && (
          <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-3 mb-3 flex items-center gap-3">
            {result.image && (
              <div className="w-28 h-28 shrink-0 overflow-hidden rounded">
                <img src={result.image} alt={result.name} className="w-full h-full object-contain scale-[2.5] -translate-y-1" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1.5">{result.name}</p>
              <div className="text-xs space-y-0.5">
                <div className="flex gap-2">
                  <span className="text-gray-400 dark:text-zinc-500 w-6 shrink-0">레벨</span>
                  <span className="text-gray-700 dark:text-zinc-300">{result.level}</span>
                </div>
                {result.class && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 dark:text-zinc-500 w-6 shrink-0">직업</span>
                    <span className="text-gray-700 dark:text-zinc-300">{result.class}</span>
                  </div>
                )}
                {result.world && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 dark:text-zinc-500 w-6 shrink-0">월드</span>
                    <span className="text-gray-700 dark:text-zinc-300">{result.world}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onConfirm(result)}
                className="mt-2.5 w-full py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 cursor-pointer transition-colors"
              >
                불러오기
              </button>
            </div>
          </div>
        )}

        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full py-1 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}
