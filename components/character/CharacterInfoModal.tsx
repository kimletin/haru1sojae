'use client';

import { useEffect } from 'react';
import type { InputValues } from '@/types';
import CharacterInfoStep from '@/components/character/CharacterInfoStep';
import { lockScroll, unlockScroll } from '@/lib/scrollLock';

interface Props {
  charName: string;
  initialInputs: InputValues;
  onApply: (inputs: InputValues) => void;
  onClose: () => void;
}

export default function CharacterInfoModal({ charName, initialInputs, onApply, onClose }: Props) {
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-[calc(100%-2rem)] max-w-[820px] max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100">정보 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors cursor-pointer text-xl leading-none"
          >×</button>
        </div>
        <CharacterInfoStep
          charName={charName}
          initialInputs={initialInputs}
          submitLabel="적용"
          disableIfUnchanged
          onSubmit={inputs => { onApply(inputs); onClose(); }}
        />
      </div>
    </div>
  );
}
