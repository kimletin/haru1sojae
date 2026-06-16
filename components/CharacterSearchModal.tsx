'use client';

import { useState } from 'react';

export interface CharacterInfo {
  name: string;
  level: number;
  class: string;
  world: string;
  image?: string | null;
  ocid?: string | null;
  guild?: string | null;
}

interface Props {
  onConfirm: (info: CharacterInfo) => void;
  onClose?: () => void;
  onSkip?: () => void;
}

export default function CharacterSearchModal({ onConfirm, onClose, onSkip }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CharacterInfo | null>(null);
  const [manualLevel, setManualLevel] = useState('');
  const [manualName, setManualName] = useState('');
  const [showManual, setShowManual] = useState(false);

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

  const manualLv = parseInt(manualLevel);
  const manualValid = manualLv >= 260 && manualLv <= 299 && manualName.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-96">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">캐릭터 추가</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
            >
              ×
            </button>
          )}
        </div>

        {/* 닉네임 검색 */}
        <div className="flex gap-2 mb-2">
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

        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        {result && (
          <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg p-3 mb-3 flex items-center gap-3">
            {result.image && (
              <div className="w-32 h-32 shrink-0 overflow-hidden rounded">
                <img src={result.image} alt={result.name} className="w-full h-full object-contain scale-[2.8] -translate-y-4" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-1.5">{result.name}</p>
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
                추가
              </button>
            </div>
          </div>
        )}

        {/* 구분선 + 수동 추가 토글 */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
          <button
            onClick={() => setShowManual(v => !v)}
            className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            수동 추가 {showManual ? '▲' : '▼'}
          </button>
          <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-700" />
        </div>

        {/* 레벨 직접 입력 */}
        {showManual && (
          <div className="flex gap-2 mt-2 items-stretch">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <input
                type="text"
                placeholder="닉네임"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                className="w-full border border-gray-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              />
              <input
                type="number"
                placeholder="레벨 (260~299)"
                value={manualLevel}
                min={260}
                max={299}
                onChange={e => setManualLevel(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && manualValid)
                    onConfirm({ name: manualName.trim(), level: manualLv, class: '', world: '' });
                }}
                style={{ textAlign: 'left' }}
                className="w-full border border-gray-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
              />
            </div>
            <button
              onClick={() => { if (manualValid) onConfirm({ name: manualName.trim(), level: manualLv, class: '', world: '' }); }}
              disabled={!manualValid}
              className="px-3 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              추가
            </button>
          </div>
        )}

        {onSkip && (
          <button
            onClick={onSkip}
            className="w-full pt-3 text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            건너뛰기
          </button>
        )}
      </div>
    </div>
  );
}
