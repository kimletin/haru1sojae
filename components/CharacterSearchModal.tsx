'use client';

import { useState, useEffect } from 'react';

export interface CharacterInfo {
  name: string;
  level: number;
  class: string;
  world: string;
  image?: string | null;
  ocid?: string | null;
  guild?: string | null;
  monsterParkBonus?: number;
  epicDungeonBonus?: number;
  treasureBonus?: number;
  expRate?: number;
}

interface Props {
  onConfirm: (info: CharacterInfo) => void;
  onClose?: () => void;
  onSkip?: () => void;
  existingOcids?: string[];
  existingNames?: string[];
}

export default function CharacterSearchModal({ onConfirm, onClose, onSkip, existingOcids = [], existingNames = [] }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CharacterInfo | null>(null);
  const [manualLevel, setManualLevel] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualExpRate, setManualExpRate] = useState('');
  const [manualMonsterPark, setManualMonsterPark] = useState('');
  const [manualEpicDungeon, setManualEpicDungeon] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [activeError, setActiveError] = useState<{ field: 'name' | 'level' | 'expRate' | 'mp' | 'ep'; msg: string } | null>(null);

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
  const expRateNum = parseFloat(manualExpRate);
  const mpNum      = parseInt(manualMonsterPark);
  const epNum      = parseInt(manualEpicDungeon);

  const getFirstError = () => {
    if (manualName.trim().length === 0) return { field: 'name'    as const, msg: '닉네임을 입력해주세요' };
    if (manualLevel === '')             return { field: 'level'   as const, msg: '레벨을 입력해주세요' };
    if (manualLv < 260 || manualLv > 299) return { field: 'level' as const, msg: '레벨이 올바르지 않아요' };
    if (manualExpRate !== '' && (isNaN(expRateNum) || expRateNum < 0 || expRateNum > 100))
                                        return { field: 'expRate' as const, msg: '경험치가 올바르지 않아요' };
    if (manualMonsterPark !== '' && (isNaN(mpNum) || mpNum < 0 || mpNum > 100))
                                        return { field: 'mp'      as const, msg: '몬파 보약이 올바르지 않아요' };
    if (manualEpicDungeon !== '' && (isNaN(epNum) || epNum < 0 || epNum > 100))
                                        return { field: 'ep'      as const, msg: '에픽 던전 보약이 올바르지 않아요' };
    return null;
  };
  const manualValid = getFirstError() === null;
  const manualExpRateVal = manualExpRate === '' ? undefined : expRateNum;

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
            maxLength={12}
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
              {(() => {
                const isDuplicate = !!result.ocid && existingOcids.includes(result.ocid);
                const isMaxLevel = result.level >= 300;
                return (
                  <button
                    onClick={() => { if (!isMaxLevel && !isDuplicate) onConfirm(result); }}
                    disabled={isMaxLevel || isDuplicate}
                    className="mt-2.5 w-full py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isMaxLevel ? '만렙을 축하합니다 🎉' : isDuplicate ? '중복된 캐릭터입니다' : '추가'}
                  </button>
                );
              })()}
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
          <div className="flex flex-col gap-2 mt-2">
            <div>
              <input
                type="text"
                placeholder="닉네임"
                maxLength={12}
                value={manualName}
                onChange={e => { setManualName(e.target.value); setActiveError(null); }}
                className={'w-full border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 ' + (activeError?.field === 'name' ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-zinc-600')}
              />
              {activeError?.field === 'name' && <p className="text-xs text-red-500 mt-0.5 px-1">{activeError.msg}</p>}
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="레벨"
                  value={manualLevel}
                  onChange={e => { setManualLevel(e.target.value.replace(/[^0-9]/g, '')); setActiveError(null); }}
                  className={'w-full border rounded-lg px-3 pr-10 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 ' + (activeError?.field === 'level' ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-zinc-600')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500 pointer-events-none">레벨</span>
              </div>
              {activeError?.field === 'level' && <p className="text-xs text-red-500 mt-0.5 px-1">{activeError.msg}</p>}
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="현재 경험치"
                  value={manualExpRate}
                  onChange={e => { setManualExpRate(e.target.value.replace(/[^0-9.]/g, '')); setActiveError(null); }}
                  className={'w-full border rounded-lg px-3 pr-8 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 ' + (activeError?.field === 'expRate' ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-zinc-600')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
              </div>
              {activeError?.field === 'expRate' && <p className="text-xs text-red-500 mt-0.5 px-1">{activeError.msg}</p>}
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="몬파 보약"
                  value={manualMonsterPark}
                  onChange={e => { setManualMonsterPark(e.target.value.replace(/[^0-9]/g, '')); setActiveError(null); }}
                  className={'w-full border rounded-lg px-3 pr-8 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 ' + (activeError?.field === 'mp' ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-zinc-600')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
              </div>
              {activeError?.field === 'mp' && <p className="text-xs text-red-500 mt-0.5 px-1">{activeError.msg}</p>}
            </div>
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="에픽 던전 보약"
                  value={manualEpicDungeon}
                  onChange={e => { setManualEpicDungeon(e.target.value.replace(/[^0-9]/g, '')); setActiveError(null); }}
                  className={'w-full border rounded-lg px-3 pr-8 py-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 ' + (activeError?.field === 'ep' ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-zinc-600')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500 pointer-events-none">%</span>
              </div>
              {activeError?.field === 'ep' && <p className="text-xs text-red-500 mt-0.5 px-1">{activeError.msg}</p>}
            </div>
            <button
              onClick={() => {
                const err = getFirstError();
                if (err) { setActiveError(err); return; }
                onConfirm({
                  name: manualName.trim(),
                  level: manualLv,
                  class: '',
                  world: '',
                  monsterParkBonus: manualMonsterPark ? parseInt(manualMonsterPark) : 0,
                  epicDungeonBonus: manualEpicDungeon ? parseInt(manualEpicDungeon) : 0,
                  expRate: manualExpRateVal,
                });
              }}
              className="w-full py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 cursor-pointer transition-colors"
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
