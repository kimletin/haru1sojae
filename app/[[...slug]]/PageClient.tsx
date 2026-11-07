'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { assetSlug } from '@/lib/assetSlug';
import type { InputValues, MobGroup, PersonalBossSelections } from '@/types';
import { calcAllItems } from '@/lib/calculator';
import CharacterInfoModal from '@/components/character/CharacterInfoModal';
import CharacterDetailModal from '@/components/character/CharacterDetailModal';
import RankingPanel from '@/components/table/RankingPanel';
import InputSummaryCard from '@/components/table/InputSummaryCard';
import EfficiencyTab from '@/components/table/EfficiencyTab';
import ExpInfoTab from '@/components/exp/ExpInfoTab';
import ExpContentsTab, { CONTENT_KEYS } from '@/components/expContents/ExpContentsTab';
import HuntingGroundTab from '@/components/hunt/HuntingGroundTab';
import InfoCenterTab from '@/components/info/InfoCenterTab';
import HomeCardSection from '@/components/home/HomeCardSection';
import NoticeBanner from '@/components/home/NoticeBanner';
import { routeTitle, NOT_FOUND_TITLE } from '@/data/routeMeta';
import AdSenseScript from '@/components/ui/AdSenseScript';
import PrivacyTab from '@/components/privacy/PrivacyTab';
import CharacterSearchModal, { type CharacterInfo } from '@/components/character/CharacterSearchModal';
import CharacterCard, { type HistoryPoint, type Ranking } from '@/components/table/CharacterCard';
import { SunIcon, MoonIcon, TabIcon } from '@/components/ui/Icons';
import type { CharMeta } from '@/types';
import { DEFAULT_INPUTS } from '@/data/defaults';
import { getDefaultHunting, HUNTING_REGIONS } from '@/data/huntingGrounds';
import { getMonsterParkZone } from '@/data/monsterPark';
import { getEpicDungeonZone } from '@/data/epicDungeonZones';

// 세션 내 오늘 경험치 조회 완료된 ocid (새로고침 시 초기화)

const PRESETS_KEY = 'haru1sojae-presets';
const PRESET_NAMES_KEY = 'haru1sojae-preset-names';
const ACTIVE_PRESET_KEY = 'haru1sojae-active-preset';
const NUM_SLOTS_KEY = 'haru1sojae-num-slots';
const CHAR_META_KEY = 'haru1sojae-char-meta';
const NUM_PRESETS = 6;
const DEFAULT_NUM_SLOTS = 0;

const CHAR_CACHE_KEY = (ocid: string) => `maple-char-${ocid}`;
const REFRESH_COOLDOWN = 60 * 1000; // 1분 — 진입/F5/탭전환 시 이 시간 내면 재요청 안 함(성공·실패 공통)

function makeDefaultMetas(): (CharMeta | null)[] {
  return Array.from({ length: NUM_PRESETS }, () => null);
}

function loadMetas(): (CharMeta | null)[] {
  try {
    const saved = localStorage.getItem(CHAR_META_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === NUM_PRESETS) return parsed;
    }
  } catch {}
  return makeDefaultMetas();
}

const DEFAULT_NAMES = ['null', 'null', 'null', 'null', 'null', 'null'];

function makeDefaultPresets(): InputValues[] {
  return Array.from({ length: NUM_PRESETS }, () => ({ ...DEFAULT_INPUTS }));
}

function loadPresets(): { presets: InputValues[]; active: number; names: string[] } {
  try {
    const savedPresets = localStorage.getItem(PRESETS_KEY);
    const savedActive = parseInt(localStorage.getItem(ACTIVE_PRESET_KEY) ?? '0');
    const savedNames = localStorage.getItem(PRESET_NAMES_KEY);
    const active = isNaN(savedActive) ? 0 : Math.min(Math.max(0, savedActive), NUM_PRESETS - 1);
    const names: string[] = savedNames
      ? (() => { try { const p = JSON.parse(savedNames); return Array.isArray(p) && p.length === NUM_PRESETS ? p : [...DEFAULT_NAMES]; } catch { return [...DEFAULT_NAMES]; } })()
      : [...DEFAULT_NAMES];
    if (savedPresets) {
      const parsed = JSON.parse(savedPresets);
      if (Array.isArray(parsed) && parsed.length === NUM_PRESETS) {
        return { presets: parsed.map(p => (p ? { ...DEFAULT_INPUTS, ...p } : { ...DEFAULT_INPUTS })), active, names };
      }
    }
  } catch {}
  return { presets: makeDefaultPresets(), active: 0, names: [...DEFAULT_NAMES] };
}

function savePresets(presets: InputValues[]) {
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); } catch {}
}

function saveNames(names: string[]) {
  try { localStorage.setItem(PRESET_NAMES_KEY, JSON.stringify(names)); } catch {}
}

// ⚠️ 탭은 순서 번호(TABS[n])가 아니라 이름으로 구분한다 — 순서를 바꾸거나 탭을 추가해도 내용이 어긋나지 않게
const TABS = [
  '경험치 효율표',
  '이벤트/컨텐츠',
  '사냥터 정보',
  '경험치 정보',
  '정보 센터',
] as const;
type Tab = typeof TABS[number];

const TAB_PARAM: Record<Tab, string> = {
  '경험치 효율표':  'table',
  '이벤트/컨텐츠':  'cont',
  '경험치 정보':    'exp',
  '사냥터 정보':    'hunt',
  '정보 센터':      'info',
};
const PARAM_TO_TAB: Record<string, Tab> = Object.fromEntries(
  Object.entries(TAB_PARAM).map(([k, v]) => [v, k as Tab])
);

/** 레벨에 맞는 초기 입력값. 사냥터·에픽 던전·몬스터파크가 그 레벨에서 갈 수 있는 곳으로 정해진다. */
function getInitialInputs(level: number): InputValues {
  const charLevel = Math.min(Math.max(level, 260), 300);
  const { region, ground } = getDefaultHunting(charLevel);
  const epicZone = getEpicDungeonZone(charLevel); // 입장 가능한 가장 높은 에픽 던전 (data/epicDungeonZones.ts)
  return {
    ...DEFAULT_INPUTS,
    charLevel,
    huntingRegion: region,
    huntingGround: ground.name,
    huntingMobs: ground.mobs,
    monsterLevel: ground.mobs[0].level,
    mobCount: ground.mobs.reduce((s, m) => s + m.count, 0),
    boosterMonsterLevel: ground.boosterLevel ?? ground.mobs[ground.mobs.length - 1].level,
    epicDungeonZone: epicZone,
    monsterParkZone: getMonsterParkZone(charLevel),
  };
}

/** 캐릭터를 추가하지 않은 방문자에게 보여줄 예시 값. 빈 화면 대신 실제로 계산된 표를 보여준다.
 *  크롤러도 localStorage가 없어 **늘 이 화면**을 보므로 효율표 내용이 그대로 색인된다.
 *  실제 캐릭터 추가와 같은 함수를 쓰므로 에픽·몬파·사냥터가 레벨에 맞게 따라온다 —
 *  레벨만 바꾸면 나머지는 알아서 맞는다. 캐릭터 카드는 비워 둬서 내 데이터가 아님이 드러나게 한다. */
const DEMO_LEVEL = 285;
/** 예시 사냥터는 데이터에서 찾아 쓴다 — 마릿수·몹 레벨이 바뀌어도 따라온다.
 *  이름이 바뀌어 못 찾으면 레벨 기본 사냥터가 그대로 쓰인다. */
const DEMO_GROUND = HUNTING_REGIONS
  .find(r => r.name === '카르시온')?.grounds
  .find(g => g.name === '잔잔한 해안가 2');
const DEMO_INPUTS: InputValues = {
  ...getInitialInputs(DEMO_LEVEL),
  dailySessions: 4,     // 일 평균 재획 2시간 (30분 단위로 센다)
  masterLabelCount: 5,  // 마스터라벨 5부위
  ...(DEMO_GROUND ? {
    huntingRegion: '카르시온',
    huntingGround: DEMO_GROUND.name,
    huntingMobs: DEMO_GROUND.mobs,
    monsterLevel: DEMO_GROUND.mobs[0].level,
    mobCount: DEMO_GROUND.mobs.reduce((s, m) => s + m.count, 0),
    boosterMonsterLevel: DEMO_GROUND.boosterLevel ?? DEMO_GROUND.mobs[DEMO_GROUND.mobs.length - 1].level,
  } : {}),
};
const DEMO_RANKED = calcAllItems(DEMO_INPUTS, 0);

// 탭 제목은 서버 <title>과 같은 값을 쓴다 — 나누면 구글이 이쪽 값을 읽어 키워드가 지워진다
// (사유는 data/routeMeta.ts 머리말 참고). 홈은 slug 없이, 모르는 주소는 404 제목.
function setTitle(slug?: string | null) {
  document.title = routeTitle(slug) ?? NOT_FOUND_TITLE;
}

function kstToday(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function loadTodayExpRateFrom(meta: CharMeta | null | undefined): number | null {
  try {
    if (meta?.manualExpRate != null) return meta.manualExpRate;
    if (meta?.ocid) {
      // CharacterCard가 저장하는 키: maple-char-${ocid}
      const raw = localStorage.getItem(`maple-char-${meta.ocid}`);
      if (raw) {
        const { history } = JSON.parse(raw) as { history?: { date: string; expRate: number | null }[] };
        const todayPoint = history?.find(p => p.date === kstToday());
        if (todayPoint?.expRate != null) return todayPoint.expRate;
      }
    }
  } catch {}
  return null;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [inputs, setInputs] = useState<InputValues>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState<Tab>('경험치 효율표');
  // 이벤트/컨텐츠 탭에서 선택한 메뉴(/cont/<키>). null이면 메뉴 화면(/cont)
  const [contentKey, setContentKey] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activePreset, setActivePreset] = useState(0);
  const [presetNames, setPresetNames] = useState<string[]>([...DEFAULT_NAMES]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null); // 삽입 위치(0~numSlots)
  // 슬롯 칩의 실제 위치를 재서 삽입 지점을 정한다(포인터 좌표 → 칩 사이 간격)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [numSlots, setNumSlots] = useState(DEFAULT_NUM_SLOTS);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchModalTarget, setSearchModalTarget] = useState(0);
  const [charMetas, setCharMetas] = useState<(CharMeta | null)[]>(makeDefaultMetas());
  const [todayExpRate, setTodayExpRate] = useState<number | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [isHome, setIsHome] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // 우측 메뉴 패널 (lg 미만 전용, 버튼으로만 열림)
  // 캐릭터 데이터(앱 레벨로 일원화) — 활성 캐릭터의 표시용 상태
  const [charHistory, setCharHistory] = useState<HistoryPoint[]>([]);
  const [charRanking, setCharRanking] = useState<Ranking | null>(null);
  const [charLoading, setCharLoading] = useState(false);
  const presetsRef = useRef<InputValues[]>(makeDefaultPresets());
  const activePresetRef = useRef(0);
  const charRefreshedAtMap = useRef<Record<string, number>>({});
  const charMetasRef = useRef<(CharMeta | null)[]>(charMetas);
  charMetasRef.current = charMetas;
  const refreshCharRef = useRef<(presetIdx: number) => void>(() => {});

  // URL → 화면 상태 매핑 (마운트 + 뒤로/앞으로 공용)
  const applyRoute = useCallback((pathname: string) => {
    const slug = pathname.replace(/^\//, '');
    const parts = slug.split('/');
    const tabSlug = parts[0];

    let tab: Tab | null = PARAM_TO_TAB[tabSlug] ?? null;
    // 하위 경로는 이벤트/컨텐츠 탭의 메뉴 주소(/cont/<메뉴 키>)만 허용하고, 그 외는 잘못된 주소로 처리
    let subKey: string | null = null;
    if (tab && parts.length > 1) {
      if (tab === '이벤트/컨텐츠' && parts.length === 2 && CONTENT_KEYS.includes(parts[1])) subKey = parts[1];
      else tab = null;
    }
    // /cont로 들어오면 첫 메뉴로 보낸다 — 고르라는 안내만 띄우지 않고 바로 쓸 수 있게.
    // replace라 뒤로 가기 기록에 /cont가 남지 않는다(돌아왔다가 다시 튕기는 일이 없다).
    if (tab === '이벤트/컨텐츠' && !subKey) {
      subKey = CONTENT_KEYS[0];
      window.history.replaceState({}, '', '/' + TAB_PARAM[tab] + '/' + subKey);
    }
    setContentKey(subKey);
    if (slug === '') {
      setIsHome(true); setIsPrivacy(false); setNotFound(false);
      setTitle(null);
    } else if (slug === 'privacy') {
      setIsPrivacy(true); setIsHome(false); setNotFound(false);
      setTitle('privacy');
    } else if (tab) {
      setActiveTab(tab); setIsHome(false); setIsPrivacy(false); setNotFound(false);
      setTitle(TAB_PARAM[tab]);
    } else {
      setNotFound(true); setIsHome(false); setIsPrivacy(false);
      document.title = NOT_FOUND_TITLE;
    }
  }, []);

  // 뒤로/앞으로 가기 시 URL에 맞춰 화면 동기화
  useEffect(() => {
    const onPop = () => applyRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [applyRoute]);

  useEffect(() => {
    applyRoute(window.location.pathname);

    const savedSlots = parseInt(localStorage.getItem(NUM_SLOTS_KEY) ?? '');
    if (!isNaN(savedSlots)) setNumSlots(Math.min(Math.max(savedSlots, 1), NUM_PRESETS));

    const metas = loadMetas();
    setCharMetas(metas);

    const { presets, active, names } = loadPresets();
    presetsRef.current = presets;
    activePresetRef.current = active;
    setActivePreset(active);
    setPresetNames(names);
    setInputs(presets[active]);

    // CharacterCard 없이도 todayExpRate 복원
    const rate = loadTodayExpRateFrom(metas[active]);
    if (rate != null) setTodayExpRate(rate);

    const saved = localStorage.getItem('maple-dark-mode');
    if (saved === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    setMounted(true);
  }, []);

  // 우측 메뉴 패널: lg 이상에서는 탭이 헤더에 바로 보이므로 토글 패널 개념이 없음 — 그 폭으로 넘어가면 강제로 닫는다
  // (자동으로 열리는 로직은 없음, lg 미만에서는 항상 버튼을 눌러야만 열림)
  useEffect(() => {
    const apply = () => { if (window.innerWidth >= 905) setMenuOpen(false); };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  useEffect(() => {
    if (isHome || isPrivacy || notFound) return;
    setTitle(TAB_PARAM[activeTab]);
  }, [activeTab, isHome, isPrivacy, notFound]);

  useEffect(() => {
    if (!mounted) return;
    const rate = loadTodayExpRateFrom(charMetas[activePreset]);
    setTodayExpRate(rate);
  }, [activePreset]);


  const handleTabChange = (tab: Tab) => {
    setNotFound(false);
    setIsPrivacy(false);
    setIsHome(false);
    setMenuOpen(false);
    setActiveTab(tab);
    // 상단바로 들어가도 이벤트/컨텐츠는 첫 메뉴부터 (주소도 /cont/<첫 키>로 맞춘다)
    const subKey = tab === '이벤트/컨텐츠' ? CONTENT_KEYS[0] : null;
    setContentKey(subKey);
    setTitle(TAB_PARAM[tab]);
    const url = '/' + TAB_PARAM[tab] + (subKey ? '/' + subKey : '');
    if (window.location.pathname !== url) window.history.pushState({}, '', url);
  };

  // 이벤트/컨텐츠 탭 메뉴 선택 → 주소를 /cont/<키>로 바꾼다(링크 공유 · 뒤로 가기 · 새로고침이 메뉴 단위로 동작)
  const handleContentSelect = (key: string) => {
    setContentKey(key);
    const url = `/cont/${key}`;
    if (window.location.pathname !== url) window.history.pushState({}, '', url);
  };

  const goHome = () => {
    setNotFound(false);
    setIsPrivacy(false);
    setIsHome(true);
    setMenuOpen(false);
    setTitle(null);
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const goPrivacy = () => {
    setNotFound(false);
    setIsHome(false);
    setIsPrivacy(true);
    setTitle('privacy');
    if (window.location.pathname !== '/privacy') window.history.pushState({}, '', '/privacy');
    window.scrollTo(0, 0);
  };

  /** 포인터 위치가 가리키는 삽입 지점(0~numSlots).
   *  칩이 여러 줄로 접히므로 **줄(y)을 먼저 보고** 같은 줄에서만 좌우(x)를 비교한다.
   *  x만 보면 아랫줄 칩이 윗줄 칩보다 앞선 것으로 잡힌다. */
  const gapFromPoint = (x: number, y: number): number => {
    for (let i = 0; i < numSlots; i++) {
      const r = slotRefs.current[i]?.getBoundingClientRect();
      if (!r) continue;
      if (y < r.top) return i;                              // 포인터가 이 칩보다 윗줄 → 앞에 삽입
      if (y <= r.bottom && x < r.left + r.width / 2) return i; // 같은 줄이면 가운데를 경계로
    }
    return numSlots;
  };

  const handleChange = (key: keyof InputValues, value: number | string | boolean | MobGroup[] | PersonalBossSelections) => {
    setInputs(prev => {
      const next = { ...prev, [key]: value };
      const newPresets = [...presetsRef.current];
      newPresets[activePresetRef.current] = next;
      presetsRef.current = newPresets;
      savePresets(newPresets);
      return next;
    });
  };

  const handleApply = (values: InputValues) => {
    setInputs(values);
    const newPresets = [...presetsRef.current];
    newPresets[activePresetRef.current] = values;
    presetsRef.current = newPresets;
    savePresets(newPresets);
  };

  const handlePresetChange = (idx: number) => {
    if (idx === activePresetRef.current) return;
    const newPresets = [...presetsRef.current];
    presetsRef.current = newPresets;
    savePresets(newPresets);
    activePresetRef.current = idx;
    setActivePreset(idx);
    setInputs(newPresets[idx]);
    try { localStorage.setItem(ACTIVE_PRESET_KEY, String(idx)); } catch {}
  };

  const handleNameChange = (idx: number, name: string) => {
    const newNames = [...presetNames];
    newNames[idx] = name;
    setPresetNames(newNames);
    saveNames(newNames);
  };

  const handleCharacterConfirm = (info: CharacterInfo, inputs: InputValues) => {
    const idx = searchModalTarget;
    // 새 슬롯이면 이때 추가
    if (idx >= numSlots) {
      const newSlots = idx + 1;
      setNumSlots(newSlots);
      try { localStorage.setItem(NUM_SLOTS_KEY, String(newSlots)); } catch {}
    }
    handleNameChange(idx, info.name.slice(0, 12));
    const newPresets = [...presetsRef.current];
    newPresets[idx] = { ...inputs, charLevel: Math.min(Math.max(info.level, 260), 300) };
    presetsRef.current = newPresets;
    savePresets(newPresets);
    if (idx === activePresetRef.current) setInputs(newPresets[idx]);

    // charMeta 저장
    const mpBonus = info.monsterParkBonus ?? 0;
    const epBonus = info.epicDungeonBonus ?? 0;
    const trBonus = info.treasureBonus ?? 0;
    const meta: CharMeta = {
      ocid: info.ocid ?? null,
      image: info.image ?? null,
      imageUpdatedAt: Date.now(),
      guild: info.guild ?? null,
      class: info.class ?? null,
      world: info.world ?? null,
      dateCreate: null,
      monsterParkBonus: mpBonus || null,
      epicDungeonBonus: epBonus || null,
      treasureBonus: trBonus || null,
      monsterParkBonuses: mpBonus > 0 ? [{ name: '보약', pct: mpBonus, icon: null }] : null,
      epicDungeonBonuses: epBonus > 0 ? [{ name: '보약', pct: epBonus, icon: null }] : null,
      treasureBonuses: trBonus > 0 ? [{ name: '보약', pct: trBonus, icon: null }] : null,
      skillUpdatedAt: mpBonus > 0 || epBonus > 0 || trBonus > 0 ? Date.now() : null,
      manualExpRate: !info.ocid && info.expRate != null ? info.expRate : null,
      masterLabelCount: null,
    };
    setCharMetas(prev => {
      const next = [...prev];
      next[idx] = meta;
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    // 수동 입력 경험치가 있으면 즉시 UI 반영 (영구 저장은 meta.manualExpRate / maple-char 캐시가 담당)
    if (info.expRate != null && idx === activePresetRef.current) {
      setTodayExpRate(info.expRate);
    }

    setShowSearchModal(false);
    handlePresetChange(idx);
  };

  const handleAddCharacter = () => {
    if (numSlots >= NUM_PRESETS) return;
    setSearchModalTarget(numSlots); // 아직 슬롯 추가 안 함
    setShowSearchModal(true);
  };

  const handleCharLevelUpdate = (idx: number, level: number) => {
    const clamped = Math.min(Math.max(level, 260), 300);
    const newPresets = [...presetsRef.current];
    newPresets[idx] = { ...newPresets[idx], charLevel: clamped };
    presetsRef.current = newPresets;
    savePresets(newPresets);
    if (idx === activePresetRef.current) setInputs(prev => ({ ...prev, charLevel: clamped }));
  };

  const handleMetaUpdate = (idx: number, patch: Partial<CharMeta>) => {
    if (idx === activePresetRef.current && patch.manualExpRate !== undefined) {
      setTodayExpRate(patch.manualExpRate ?? null);
    }
    setCharMetas(prev => {
      const next = [...prev];
      if (next[idx]) next[idx] = { ...next[idx]!, ...patch };
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // 캐릭터 데이터 갱신(앱 레벨) — 진입/F5/탭전환/슬롯전환 시 호출. 1분 쿨다운(성공·실패 공통).
  // 매 렌더마다 최신 클로저로 재할당해 stale 클로저 방지.
  refreshCharRef.current = async (presetIdx: number) => {
    const meta = charMetasRef.current[presetIdx];
    const ocid = meta?.ocid;
    if (!ocid) return;

    let lastAttempt = charRefreshedAtMap.current[ocid] ?? null;
    if (lastAttempt == null) {
      try {
        const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid));
        if (raw) lastAttempt = JSON.parse(raw).savedAt ?? null;
      } catch {}
    }
    if (lastAttempt != null && Date.now() - lastAttempt < REFRESH_COOLDOWN) return;

    charRefreshedAtMap.current[ocid] = Date.now(); // 시도 시각(실패해도 쿨다운 유지)
    setCharLoading(true);
    try {
      const rankParams = new URLSearchParams({ ocid });
      if (meta.world) rankParams.set('world', meta.world);
      if (meta.class) rankParams.set('class', meta.class);

      // 닉네임으로 현재 ocid를 매번 다시 물어본다.
      // 월드 이전을 하면 ocid가 바뀌는데, 옛 ocid로도 과거 날짜는 계속 조회돼서
      // "조회 실패"만으로는 이전 여부를 알 수 없다. /id의 답을 기준으로 삼는 게 확실하다.
      // 이름→ocid는 60초 캐시(전 방문자 공유)라 이 호출 자체의 부담은 거의 없다. 다만 만료 후
      // 첫 요청은 옛 값을 받으므로(stale-while-revalidate), 리프 직후 재연결이 한 사이클 늦을 수 있다.
      const [histData, rankData, skillData, cashData, idData] = await Promise.all([
        fetch(`/api/character/history?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character/ranking?${rankParams}`).then(r => r.json()),
        fetch(`/api/character/skill?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character/cashitem?ocid=${encodeURIComponent(ocid)}`).then(r => r.json()),
        fetch(`/api/character?name=${encodeURIComponent(presetNames[presetIdx])}`).then(r => r.json()).catch(() => null),
      ]);

      // 저장된 닉네임으로 조회한 ocid가 저장된 것과 다르다 = 월드 리프.
      // 슬롯을 새 ocid로 재연결하고 이번 응답은 버린다(ocid가 바뀌면 자동 갱신 effect가 곧바로 다시 돈다).
      if (idData?.ocid && idData.ocid !== ocid) {
        // 히스토리 캐시를 새 키로 옮겨 그래프가 끊기지 않게 한다.
        // savedAt은 빼고 옮긴다 — 쿨다운 판정에 쓰이는 값이라 그대로 물려주면 최대 1분 갱신이 막힌다.
        try {
          const oldCache = localStorage.getItem(CHAR_CACHE_KEY(ocid));
          if (oldCache) {
            const parsed = JSON.parse(oldCache);
            delete parsed.savedAt;
            localStorage.setItem(CHAR_CACHE_KEY(idData.ocid), JSON.stringify(parsed));
          }
          localStorage.removeItem(CHAR_CACHE_KEY(ocid));
        } catch {}
        // world는 랭킹 조회 파라미터라 이전 후 반드시 갱신돼야 한다
        handleMetaUpdate(presetIdx, {
          ocid: idData.ocid,
          world: idData.world ?? null,
          class: idData.class ?? null,
          guild: idData.guild ?? null,
          image: idData.image ?? null,
          dateCreate: idData.dateCreate ?? meta.dateCreate,
        });
        return;
      }

      // history 응답은 { history: HistoryPoint[], basic: {...} } — basic은 오늘 호출에서 추출(별도 basic 호출 제거)
      let histArr: HistoryPoint[] | null = Array.isArray(histData?.history) ? histData.history : null;
      const basic = histData?.basic ?? null;

      // 캐시 보충은 '오늘'에만 적용한다(오늘 호출은 no-store라 실패 시 값이 사라지므로 캐시로 유지).
      // 과거 날짜(어제 포함)는 NEXON 일자 스냅샷이 있을 때만 표시 — 자정 직후 전일 스냅샷이 아직
      // 없으면 막대를 비워두고, NEXON이 스냅샷을 제공하는 순간부터 보이게 한다.
      // 단 전체 실패(점검 등)면 캐시 전체를 유지해 빈 그래프를 막는다.
      let prevCache: { savedAt?: number; history?: HistoryPoint[]; ranking?: Ranking | null } = {};
      try { const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid)); if (raw) prevCache = JSON.parse(raw); } catch {}
      if (histArr && histArr.length > 0) {
        const today = kstToday();
        if (!histArr.some(p => p.date === today)) {
          const cachedToday = (prevCache.history ?? []).find(p => p.date === today);
          if (cachedToday) {
            histArr.push(cachedToday);
            histArr.sort((a, b) => a.date.localeCompare(b.date));
          }
        }
      } else if (Array.isArray(histData?.history)) {
        histArr = prevCache.history ?? []; // 응답은 왔지만 전 날짜 실패(점검 등) → 캐시 전체 유지
      }

      const histOk  = histArr !== null && histArr.length > 0;
      const rankOk  = rankData && typeof rankData === 'object' && rankData.error === undefined;
      const imageOk = basic != null;

      // 저장된 닉네임으로는 ocid를 못 찾았는데 기존 ocid는 살아 있다 = 닉네임 변경.
      // 기존 ocid의 현재 시점 조회(history 라우트가 /character/basic을 날짜 없이 부른 결과)가
      // 준 현재 닉네임으로 슬롯 이름을 갱신한다.
      if (!idData?.ocid && imageOk && basic.name && basic.name !== presetNames[presetIdx]) {
        const newNames = [...presetNames];
        newNames[presetIdx] = basic.name;
        setPresetNames(newNames);
        saveNames(newNames);
      }
      const skillOk = skillData && skillData.monsterParkBonus !== undefined;
      const cashOk  = cashData && typeof cashData.masterLabelCount === 'number';

      // await 도중 슬롯이 바뀌었을 수 있으므로, 화면 상태에 반영하기 직전에
      // 현재 활성 슬롯(ref는 항상 최신)과 다시 비교한다.
      // (늦게 도착한 A 슬롯 응답이 B 슬롯 화면에 표시되는 레이스 컨디션 방지)
      const stillActive = presetIdx === activePresetRef.current;
      if (histOk && stillActive && histArr) {
        setCharHistory(histArr);
        const todayPoint = histArr.find(pt => pt.date === kstToday()) ?? null;
        setTodayExpRate(todayPoint?.expRate ?? null);
      }
      if (rankOk && stillActive) setCharRanking(rankData);

      if (imageOk || skillOk || cashOk) {
        const metaUpdate: Record<string, unknown> = {};
        // 실제 착용 개수는 입력값(수동 우선)과 별개로 보관 — 입력정보에서 "실착" 표시에 쓰인다
        if (cashOk) metaUpdate.masterLabelCount = cashData.masterLabelCount;
        if (imageOk) {
          metaUpdate.imageUpdatedAt = Date.now();
          metaUpdate.image = basic.image;
          if (basic.class !== undefined) metaUpdate.class = basic.class;
          if (basic.world !== undefined) metaUpdate.world = basic.world;
          if (basic.guild !== undefined) metaUpdate.guild = basic.guild;
          if (basic.dateCreate !== undefined) metaUpdate.dateCreate = basic.dateCreate;
        }
        if (skillOk) {
          metaUpdate.skillUpdatedAt = Date.now();
          metaUpdate.monsterParkBonus = skillData.monsterParkBonus;
          metaUpdate.epicDungeonBonus = skillData.epicDungeonBonus;
          metaUpdate.monsterParkBonuses = skillData.monsterParkBonuses ?? [];
          metaUpdate.epicDungeonBonuses = skillData.epicDungeonBonuses ?? [];
          metaUpdate.treasureBonus = skillData.treasureBonus;
          metaUpdate.treasureBonuses = skillData.treasureBonuses ?? [];
        }
        handleMetaUpdate(presetIdx, metaUpdate as Partial<CharMeta>);
      }
      if (imageOk && basic.level != null) {
        handleCharLevelUpdate(presetIdx, basic.level);
      }
      if (histOk) {
        charRefreshedAtMap.current[ocid] = Date.now();
      }

      if (histOk || rankOk) {
        const cache = {
          savedAt: histOk ? Date.now() : (prevCache.savedAt ?? Date.now()),
          history: histOk ? histArr : (prevCache.history ?? []),
          ranking: rankOk ? rankData : (prevCache.ranking ?? null),
        };
        try { localStorage.setItem(CHAR_CACHE_KEY(ocid), JSON.stringify(cache)); } catch {}
      }
    } catch {
      // 실패: 조용히 마지막 정상 데이터 유지. 쿨다운은 시도 시각으로 이미 설정됨.
    } finally {
      setCharLoading(false);
    }
  };

  // 활성 캐릭터 변경 시 캐시에서 표시 데이터 로드
  useEffect(() => {
    if (!mounted) return;
    const ocid = charMetas[activePreset]?.ocid;
    if (!ocid) {
      setCharHistory([]); setCharRanking(null);
      return;
    }
    try {
      const raw = localStorage.getItem(CHAR_CACHE_KEY(ocid));
      if (raw) {
        const cache = JSON.parse(raw);
        setCharHistory(cache.history ?? []);
        setCharRanking(cache.ranking ?? null);
      } else {
        setCharHistory([]); setCharRanking(null);
      }
    } catch {}
  }, [mounted, activePreset, charMetas[activePreset]?.ocid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 갱신 트리거 — 캐릭터 쓰는 탭(정보센터/홈 제외) 진입·F5·탭전환·슬롯전환·캐릭터 추가 시
  useEffect(() => {
    if (!mounted || isHome || isPrivacy || notFound) return;
    if (activeTab === '정보 센터') return;
    refreshCharRef.current(activePreset);
  }, [mounted, activeTab, activePreset, isHome, isPrivacy, notFound, charMetas[activePreset]?.ocid]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteSlot = (idx: number) => {
    if (numSlots <= 1) return;

    // 삭제되는 슬롯의 ocid 캐시 제거 (CharacterCard가 쓰는 실제 키)
    const deletedOcid = charMetas[idx]?.ocid;
    if (deletedOcid) {
      try { localStorage.removeItem(`maple-char-${deletedOcid}`); } catch {}
    }

    const newNames = [...presetNames];
    const newPresets = [...presetsRef.current];
    newNames.splice(idx, 1);
    newNames.push(DEFAULT_NAMES[newNames.length] ?? String(newNames.length + 1));
    newPresets.splice(idx, 1);
    newPresets.push({ ...DEFAULT_INPUTS });
    const newSlots = numSlots - 1;
    let newActive = activePreset;
    if (activePreset === idx) newActive = Math.max(0, idx - 1);
    else if (activePreset > idx) newActive = activePreset - 1;
    setNumSlots(newSlots);
    setPresetNames(newNames);
    saveNames(newNames);
    presetsRef.current = newPresets;
    savePresets(newPresets);
    activePresetRef.current = newActive;
    setActivePreset(newActive);
    setInputs(newPresets[newActive]);

    // charMeta 업데이트
    setCharMetas(prev => {
      const next = [...prev];
      next.splice(idx, 1);
      next.push(null);
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });

    try { localStorage.setItem(ACTIVE_PRESET_KEY, String(newActive)); } catch {}
    try { localStorage.setItem(NUM_SLOTS_KEY, String(newSlots)); } catch {}
  };

  const handleReorder = (from: number, to: number) => {
    if (from === to) return;
    const newNames = [...presetNames];
    const newPresets = [...presetsRef.current];
    const [n] = newNames.splice(from, 1);
    newNames.splice(to, 0, n);
    const [p] = newPresets.splice(from, 1);
    newPresets.splice(to, 0, p);
    setPresetNames(newNames);
    saveNames(newNames);
    presetsRef.current = newPresets;
    savePresets(newPresets);
    setCharMetas(prev => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      try { localStorage.setItem(CHAR_META_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    let newActive = activePreset;
    if (activePreset === from) newActive = to;
    else if (from < to && activePreset > from && activePreset <= to) newActive = activePreset - 1;
    else if (from > to && activePreset >= to && activePreset < from) newActive = activePreset + 1;
    activePresetRef.current = newActive;
    setActivePreset(newActive);
    setInputs(newPresets[newActive]);
    try { localStorage.setItem(ACTIVE_PRESET_KEY, String(newActive)); } catch {}
  };

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    try { localStorage.setItem('maple-dark-mode', String(next)); } catch {}
  };

  const rankedItems = useMemo(
    () => calcAllItems(inputs, charMetas[activePreset]?.monsterParkBonus ?? 0),
    [inputs, charMetas, activePreset]
  );

  if (!mounted) return <div className="min-h-dvh bg-gray-50 dark:bg-black" />;

  // 광고는 읽을 콘텐츠가 있는 화면에만 띄운다 — 404(이동 목적 화면)·개인정보처리방침(법률 고지)은 제외.
  // mounted 게이트 뒤에 있으므로 내용이 그려지기 전 빈 화면에도 붙지 않는다.
  // (2026-11 애드센스 반려 사유: "게시자 콘텐츠가 없는 화면에 Google 게재 광고")
  const showAds = !notFound && !isPrivacy;

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-black">
      {showAds && <AdSenseScript />}
      {showSearchModal && (
        <CharacterSearchModal
          onConfirm={handleCharacterConfirm}
          onClose={() => setShowSearchModal(false)}
          getInitialInputs={getInitialInputs}
          existingOcids={charMetas.filter(m => m?.ocid).map(m => m!.ocid!)}
          loadSources={Array.from({ length: numSlots }, (_, i) => ({ name: presetNames[i], inputs: presetsRef.current[i] }))}
        />
      )}
      {showInfoModal && (
        <CharacterInfoModal
          charName={presetNames[activePreset]}
          initialInputs={inputs}
          onApply={handleApply}
          onClose={() => setShowInfoModal(false)}
          loadSources={Array.from({ length: numSlots }, (_, i) => ({ name: presetNames[i], inputs: presetsRef.current[i] })).filter((_, i) => i !== activePreset)}
          apiMasterLabelCount={charMetas[activePreset]?.masterLabelCount ?? null}
        />
      )}
      {showDetailModal && charMetas[activePreset]?.ocid && (
        <CharacterDetailModal
          name={presetNames[activePreset]}
          history={charHistory}
          ranking={charRanking}
          onClose={() => setShowDetailModal(false)}
        />
      )}
      <header className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-600 shrink-0 z-50 shadow-sm">
        <div className="w-full px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={goHome}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <img src="/icon.png" alt="icon" className="w-8 h-8 translate-y-[1px]" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">하루<span className="text-orange-500">1소재</span></h1>
          </button>
          <div className="flex items-center gap-3">
            {/* lg 이상: 탭 메뉴가 헤더에 바로 보임 */}
            <nav className="hidden lg:flex items-center gap-1">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={
                    'px-3 py-2 flex items-center gap-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ' +
                    (activeTab === tab && !notFound && !isPrivacy && !isHome ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700')
                  }
                >
                  <TabIcon tab={tab} className="shrink-0" />
                  {tab}
                </button>
              ))}
            </nav>
            {/* lg 미만: 햄버거 버튼으로만 메뉴 열림 */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              aria-label="메뉴"
              className="order-2 lg:hidden p-1.5 rounded-lg transition-colors cursor-pointer text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              )}
            </button>
            <button
              onClick={toggleDark}
              className="order-1 p-1.5 rounded-lg transition-colors cursor-pointer text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      {/* lg 미만에서 메뉴 열릴 때 항상 배경 딤 */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setMenuOpen(false)} />
      )}
      {/* 우측 메뉴 패널 (lg 미만 전용) */}
      <aside
        className={
          'lg:hidden fixed top-0 right-0 bottom-0 z-40 w-[200px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-600 shadow-lg pt-[64px] flex flex-col transition-transform duration-200 ' +
          (menuOpen ? 'translate-x-0' : 'translate-x-full')
        }
      >
        <nav className="flex flex-col p-2 gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={
                'px-4 py-3 flex items-center gap-2.5 text-left text-sm font-medium rounded-lg transition-colors cursor-pointer ' +
                (activeTab === tab && !notFound && !isPrivacy && !isHome ? 'bg-orange-500 text-white' : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-700')
              }
            >
              <TabIcon tab={tab} className="shrink-0" />
              {tab}
            </button>
          ))}
        </nav>
      </aside>

      <div id="app-scroll" className="flex-1 flex flex-col bg-gray-50 dark:bg-black">
      <div className="flex-1 flex flex-col">
      {/* 404일 때만 flex 컬럼으로 — 안쪽 404 블록이 남은 높이를 받아 세로 가운데로 온다.
          다른 탭은 기존대로 블록 흐름을 쓴다(레이아웃에 영향 없게) */}
      <div className={'flex-1 pb-10' + (notFound ? ' flex flex-col' : '')}>
      {notFound ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-4 py-10">
          <img src="/404.png" alt="404" />
          <p className="text-4xl font-bold text-gray-800 dark:text-zinc-100">404</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">페이지를 찾을 수 없습니다.</p>
          <button
            onClick={goHome}
            className="mt-1 px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors cursor-pointer"
          >메인으로</button>
        </div>
      ) : isHome ? (
      <div className="flex flex-col items-center justify-center gap-4 px-4 py-6 text-center">
        <NoticeBanner onNavigate={href => { if (href === '/privacy') goPrivacy(); }} />
        <div className="relative w-full max-w-[905px] aspect-[905/300] rounded-2xl overflow-hidden shadow-sm">
          <img
            src={`/main/${assetSlug('main banner')}.webp`}
            alt="하루1소재"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/25" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-4">
            <h2
              className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
            >하루<span className="text-orange-500">1소재</span></h2>
            <p
              className="text-xs lg:text-base font-medium text-white/90"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}
            >메이플스토리 경험치 효율 시뮬레이터</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 w-full max-w-[905px]">
          {TABS.filter(t => t !== '정보 센터').map(t => (
            <button key={t} onClick={() => handleTabChange(t)}
              className="h-16 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm hover:border-orange-400 hover:shadow transition-all cursor-pointer text-[14px] font-semibold text-gray-700 dark:text-zinc-200 flex flex-row items-center justify-center gap-2">
              {/* 헤더 메뉴와 같은 TabIcon — 홈 버튼에서만 18px → 20px로 키운다 */}
              <TabIcon tab={t} className="shrink-0 w-[20px] h-[20px]" />
              {t}
            </button>
          ))}
        </div>
        <HomeCardSection />
      </div>
      ) : isPrivacy ? (
      <div className="mx-auto px-4 py-6">
        <div className="w-full max-w-[905px] mx-auto">
          <PrivacyTab />
        </div>
      </div>
      ) : (
      <div className="mx-auto px-4 py-6">
        <div className="w-full max-w-[905px] mx-auto">
          {/* flex-wrap — 슬롯이 많거나 닉네임이 길면 칩 단위로 다음 줄에 넘긴다.
              없으면 칩이 눌려 닉네임이 칩 안에서 줄바꿈돼 편집이 어려워진다. */}
          {activeTab !== '정보 센터' && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">캐릭터</span>
            {Array.from({ length: numSlots }, (_, i) => (
              isEditMode ? (
                <div
                  key={i}
                  ref={el => { slotRefs.current[i] = el; }}
                  className={'relative shrink-0 ' + (dragIndex === i ? 'opacity-40' : '')}
                >
                  {dragIndex !== null && dropGap === i && (
                    <span className="absolute -left-[5px] top-0 bottom-0 w-[3px] bg-orange-500 rounded-full pointer-events-none" />
                  )}
                  {dragIndex !== null && dropGap === numSlots && i === numSlots - 1 && (
                    <span className="absolute -right-[5px] top-0 bottom-0 w-[3px] bg-orange-500 rounded-full pointer-events-none" />
                  )}
                  <div
                    className={
                      'flex items-center h-7 rounded-lg border text-xs transition-colors select-none ' +
                      (charMetas[i] && !charMetas[i].ocid
                        ? 'border-dashed border-gray-300 dark:border-zinc-500 bg-gray-50 dark:bg-zinc-800'
                        : 'border-gray-200 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800')
                    }
                  >
                    {/* 드래그는 이 손잡이에서만 받는다 — 칩 전체로 받으면 스크롤하려다 순서가 바뀐다.
                        포인터 이벤트라 마우스·터치가 같은 코드로 동작한다(HTML5 DnD는 터치에서 안 뜬다).
                        touch-none은 손잡이에만 걸어 페이지 스크롤은 그대로 둔다. */}
                    <span
                      onPointerDown={e => {
                        e.preventDefault();
                        e.currentTarget.setPointerCapture(e.pointerId);
                        setDragIndex(i); setDropGap(i);
                      }}
                      onPointerMove={e => {
                        if (dragIndex === null) return;
                        setDropGap(gapFromPoint(e.clientX, e.clientY));
                      }}
                      onPointerUp={() => {
                        if (dragIndex !== null && dropGap !== null) {
                          const to = dropGap > dragIndex ? dropGap - 1 : dropGap;
                          if (to !== dragIndex) handleReorder(dragIndex, to);
                        }
                        setDragIndex(null); setDropGap(null);
                      }}
                      onPointerCancel={() => { setDragIndex(null); setDropGap(null); }}
                      className="px-2.5 lg:px-1.5 self-stretch flex items-center cursor-grab active:cursor-grabbing touch-none select-none text-gray-400 dark:text-zinc-500"
                    >
                      <svg width="8" height="13" viewBox="0 0 8 13" fill="currentColor">
                        <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                        <circle cx="2" cy="6.5" r="1.2"/><circle cx="6" cy="6.5" r="1.2"/>
                        <circle cx="2" cy="11" r="1.2"/><circle cx="6" cy="11" r="1.2"/>
                      </svg>
                    </span>
                    <span className="px-1.5 text-gray-700 dark:text-zinc-300 font-semibold whitespace-nowrap">{presetNames[i]}</span>
                    <button
                      onClick={() => handleDeleteSlot(i)}
                      className={`px-1.5 transition-colors cursor-pointer ${numSlots === 1 ? 'text-gray-200 dark:text-zinc-700 cursor-not-allowed' : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  key={i}
                  onClick={() => handlePresetChange(i)}
                  className={
                    'h-7 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer border shrink-0 whitespace-nowrap ' +
                    (activePreset === i
                      ? 'bg-orange-500 text-white border-orange-500'
                      : (charMetas[i] && !charMetas[i].ocid
                          ? 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border-dashed border-gray-300 dark:border-zinc-500'
                          : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-600'))
                  }
                >
                  {presetNames[i]}
                </button>
              )
            ))}
            {!isEditMode && numSlots < NUM_PRESETS && (
              <button
                onClick={handleAddCharacter}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-dashed border-gray-300 dark:border-zinc-600"
                title="캐릭터 추가"
              >
                +
              </button>
            )}
            {numSlots > 0 && (
              <button
                onClick={() => setIsEditMode(v => !v)}
                className="h-7 px-2 text-xs underline transition-colors cursor-pointer text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                {isEditMode ? '완료' : '편집'}
              </button>
            )}
          </div>
          )}
          {activeTab === '경험치 효율표' ? (
            numSlots === 0 ? (
            /* 캐릭터가 없을 때: 빈 화면 대신 예시 입력값으로 계산한 표를 그대로 보여준다.
               캐릭터 카드만 비워 두고 거기에 추가 버튼을 둬서 내 데이터가 아님이 드러나게 한다. */
            <div className="flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
                  <div className="w-full lg:w-[560px] lg:shrink-0">
                    <CharacterCard
                      name=""
                      level={DEMO_LEVEL}
                      meta={null}
                      isEmpty
                      history={[]}
                      ranking={null}
                      loading={false}
                      onAdd={handleAddCharacter}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* 예시라 고칠 대상이 없다 — onEditInfo를 주지 않으면 수정 버튼이 안 그려진다 */}
                    <InputSummaryCard inputs={DEMO_INPUTS} meta={null} />
                  </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                  <div className="w-full lg:w-[560px] lg:shrink-0">
                    <EfficiencyTab inputs={DEMO_INPUTS} onChange={() => {}} monsterParkBonus={0} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <RankingPanel items={DEMO_RANKED} />
                  </div>
                </div>
            </div>
            ) : (
            <div className="flex flex-col gap-4">
                {/* 상단: 캐릭터카드 + 입력정보 좌우 (lg:items-stretch로 높이 맞춤) */}
                <div className="flex flex-col lg:flex-row gap-4 lg:items-stretch">
                  <div className="w-full lg:w-[560px] lg:shrink-0">
                    <CharacterCard
                      name={presetNames[activePreset]}
                      level={presetsRef.current[activePreset]?.charLevel ?? inputs.charLevel}
                      meta={charMetas[activePreset]}
                      isEmpty={numSlots === 0}
                      history={charHistory}
                      ranking={charRanking}
                      loading={charLoading}
                      onOpenDetail={() => setShowDetailModal(true)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <InputSummaryCard inputs={inputs} meta={charMetas[activePreset]} onEditInfo={() => setShowInfoModal(true)} />
                  </div>
                </div>
                {/* 하단: 효율표 + 가성비 순위 좌우 (items-start로 각자 자연 높이) */}
                <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                  <div className="w-full lg:w-[560px] lg:shrink-0">
                    <EfficiencyTab inputs={inputs} onChange={handleChange} monsterParkBonus={charMetas[activePreset]?.monsterParkBonus ?? 0} parkBonuses={charMetas[activePreset]?.monsterParkBonuses} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <RankingPanel items={rankedItems} parkBonuses={charMetas[activePreset]?.monsterParkBonuses} />
                  </div>
                </div>
            </div>
            )
          ) : (
            <div>
                {activeTab === '이벤트/컨텐츠' && (
                  <ExpContentsTab
                    charLevel={inputs.charLevel}
                    monsterLevel={inputs.monsterLevel}
                    monsterParkBonus={charMetas[activePreset]?.monsterParkBonus ?? 0}
                    monsterParkZone={inputs.monsterParkZone}
                    epicDungeonBonus={charMetas[activePreset]?.epicDungeonBonus ?? 0}
                    treasureBonus={charMetas[activePreset]?.treasureBonus ?? 0}
                    todayExpRate={todayExpRate}
                    slotKey={activePreset}
                    hasCharacter={numSlots > 0}
                    expBonus={inputs.expBonus}
                    selected={contentKey}
                    onSelect={handleContentSelect}
                    personalBoss={inputs.personalBoss ?? {}}
                    onPersonalBossChange={next => handleChange('personalBoss', next)}
                  />
                )}
                {activeTab === '경험치 정보' && (
                  <ExpInfoTab charLevel={inputs.charLevel} monsterLevel={inputs.monsterLevel} huntingMobs={inputs.huntingMobs} hasCharacter={numSlots > 0} />
                )}
                {activeTab === '사냥터 정보' && (
                  <HuntingGroundTab charLevel={inputs.charLevel} huntingRegion={inputs.huntingRegion} huntingGround={inputs.huntingGround} hasCharacter={numSlots > 0} onAddCharacter={handleAddCharacter} />
                )}
                {activeTab === '정보 센터' && (
                  <InfoCenterTab />
                )}
            </div>
          )}
        </div>
      </div>
      )}
      </div>
      <footer className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-600 shrink-0">
        <div className="w-full max-w-[905px] mx-auto px-4 py-6 flex flex-col items-center gap-2.5 text-center">
          {/* 문의 창구는 카카오톡 오픈채팅 — 아이콘만 두고 올리면 카카오 노란색.
              이메일(contact@haru1sojae.kr)은 개인정보처리방침에만 둔다 */}
          <a
            href="https://open.kakao.com/me/letin_k"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="오픈채팅 문의"
            title="오픈채팅 문의"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:bg-[#FEE500] hover:text-[#3C1E1E] transition-colors"
          >
            {/* 말풍선 아이콘 */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="block">
              <path d="M12 3C6.9 3 2.8 6.2 2.8 10.2c0 2.5 1.7 4.7 4.2 6L6.2 20c-.1.3.2.5.5.4l4.1-2.4c.4 0 .8.1 1.2.1 5.1 0 9.2-3.2 9.2-7.2S17.1 3 12 3Z" />
            </svg>
          </a>
          <div className="flex flex-col leading-relaxed">
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">Data based on NEXON OPEN API</p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">This site is not an official site of NEXON and does not provide any warranty.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <p className="text-gray-400 dark:text-zinc-500">© 2026 하루1소재 by 레틴. All rights reserved.</p>
            <span className="text-gray-300 dark:text-zinc-600">|</span>
            <a href="/privacy" onClick={(e) => { e.preventDefault(); goPrivacy(); }} className="text-gray-400 dark:text-zinc-500">개인정보처리방침</a>
          </div>
        </div>
      </footer>
      </div>
      </div>
    </div>
  );
}
