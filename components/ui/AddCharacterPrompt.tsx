/** 캐릭터가 하나도 없을 때 캐릭터가 있어야 쓸 수 있는 화면(경험치 효율표)에 띄우는 안내 */
export default function AddCharacterPrompt({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center py-24">
      <img src="/table.png" alt="" />
      <p className="text-lg font-semibold text-gray-700 dark:text-zinc-200">캐릭터를 추가해주세요</p>
      <button onClick={onAdd} className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors cursor-pointer">캐릭터 추가</button>
    </div>
  );
}
