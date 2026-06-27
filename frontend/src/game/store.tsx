import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAPTERS } from './data';
import { computeNewStreak, todayKey } from './streaks';
import { setChapterStatusDone } from '../finlabs/storage';
import {
  computeFinancialHealthScore,
  getChapterTargetLength,
  isBadChoice,
  MIN_SCENARIOS,
} from './scoring';
import { Chapter, Choice, GameState, Scenario, StatDelta } from './types';

const STORAGE_KEY = '@finlife/state/v1';

const SCENARIO_ORDER_BY_CHAPTER: Record<string, string[]> = {
  childhood: ['c1s4', 'c1s3', 'c1s2', 'c1s1', 'c1s5', 'c1s6'],
};

export function getOrderedChapterScenarios(chapter: Chapter): Scenario[] {
  const order = SCENARIO_ORDER_BY_CHAPTER[chapter.id];
  if (!order) return chapter.scenarios;

  const ordered = order
    .map((id) => chapter.scenarios.find((scenario) => scenario.id === id))
    .filter((scenario): scenario is Scenario => !!scenario);
  const orderedIds = new Set(ordered.map((scenario) => scenario.id));
  const remaining = chapter.scenarios.filter((scenario) => !orderedIds.has(scenario.id));
  return [...ordered, ...remaining];
}

const INITIAL: GameState = {
  age: 8,
  cash: 0,
  savings: 0,
  debt: 0,
  happiness: 70,
  knowledge: 10,
  flags: {},
  chapterId: null,
  scenarioIndex: 0,
  chaptersCompleted: [],
  log: [],
  playerName: null,
  introCompleted: false,
  streakCount: 0,
  lastStreakDate: null,
  pendingLessonDate: null,
  termsLearned: [],
  termsSeen: [],
  financialHealthScore: 50,
  consecutiveBadDecisions: 0,
  chapterScenarioIds: [],
  recentlyAddedScenarioIds: [],
  chapterProgress: {},
};

type Action =
  | { type: 'HYDRATE'; state: GameState }
  | { type: 'RESET' }
  | { type: 'START_CHAPTER'; chapterId: string }
  | { type: 'APPLY_CHOICE'; choice: Choice; scenario: Scenario }
  | { type: 'COMPLETE_CHAPTER'; chapter: Chapter }
  | { type: 'COMPLETE_STREAK_TERM'; termId: string }
  | { type: 'MARK_TERMS_SEEN'; termNames: string[] }
  | { type: 'COMPLETE_INTRO'; playerName: string }
  | { type: 'CLEAR_RECENTLY_ADDED' };

function appendBonusScenarios(
  chapter: Chapter,
  currentIds: string[],
  targetLength: number,
): { ids: string[]; added: string[] } {
  if (targetLength <= currentIds.length) {
    return { ids: currentIds, added: [] };
  }
  const bonusPool = getOrderedChapterScenarios(chapter).slice(MIN_SCENARIOS);
  const needed = targetLength - currentIds.length;
  const available = bonusPool.filter((s) => !currentIds.includes(s.id));
  const toAdd = available.slice(0, needed).map((s) => s.id);
  return { ids: [...currentIds, ...toAdd], added: toAdd };
}

function applyDelta(s: GameState, d: StatDelta): GameState {
  return {
    ...s,
    cash: Math.max(0, s.cash + (d.cash ?? 0)),
    savings: Math.max(0, s.savings + (d.savings ?? 0)),
    debt: Math.max(0, s.debt + (d.debt ?? 0)),
    happiness: Math.max(0, Math.min(100, s.happiness + (d.happiness ?? 0))),
    knowledge: Math.max(0, Math.min(100, s.knowledge + (d.knowledge ?? 0))),
  };
}

// Compound interest on savings during time fast-forward.
// 8% annual on savings, debt grows at 10% if not serviced.
function compound(s: GameState, years: number): GameState {
  if (years <= 0) return s;
  let savings = s.savings;
  let debt = s.debt;
  for (let i = 0; i < years; i++) {
    savings = Math.round(savings * 1.08);
    debt = Math.round(debt * 1.04); // soft growth (servicing assumed partial)
  }
  return { ...s, savings, debt, age: s.age + years };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'RESET':
      // Preserve the player's name + intro flag so they don't have to redo onboarding.
      return { ...INITIAL, playerName: state.playerName, introCompleted: state.introCompleted };
    case 'COMPLETE_INTRO':
      return { ...state, playerName: action.playerName, introCompleted: true };
    case 'START_CHAPTER': {
      const ch = CHAPTERS.find((c) => c.id === action.chapterId);
      if (!ch) return state;

      if (
        state.chapterId === action.chapterId &&
        state.chapterScenarioIds.length >= MIN_SCENARIOS
      ) {
        return state;
      }

      const orderedScenarios = getOrderedChapterScenarios(ch);
      const startAge = orderedScenarios[0].age;
      const coreIds = orderedScenarios.slice(0, MIN_SCENARIOS).map((s) => s.id);
      return {
        ...state,
        chapterId: ch.id,
        scenarioIndex: 0,
        age: Math.max(state.age, startAge),
        cash: state.cash + (ch.index === 1 ? 500 : ch.index === 2 ? 5000 : ch.index === 3 ? 20000 : ch.index === 4 ? 100000 : 20000),
        chapterScenarioIds: coreIds,
        recentlyAddedScenarioIds: [],
        consecutiveBadDecisions: 0,
        financialHealthScore: computeFinancialHealthScore(state),
      };
    }
    case 'APPLY_CHOICE': {
      let s = applyDelta(state, action.choice.delta);
      // set flags
      if (action.choice.setFlags) {
        const flags = { ...s.flags };
        for (const f of action.choice.setFlags) flags[f] = true;
        s = { ...s, flags };
      }
      // log
      s = {
        ...s,
        log: [
          ...s.log,
          { age: s.age, text: `${action.scenario.title}: ${action.choice.label}` },
        ],
      };
      // advance time + compound (scenarios can opt out of auto-compounding)
      if (action.scenario.skipCompound) {
        s = { ...s, age: s.age + action.scenario.advanceYears };
      } else {
        s = compound(s, action.scenario.advanceYears);
      }
      // Apply any future deltas due at/by the new age
      // (For simplicity we trigger if scheduled futureAge <= new age and not yet applied)
      // We add a flag _future_<choiceid> to avoid double-trigger
      if (action.choice.futureAge && action.choice.futureDelta && s.age >= action.choice.futureAge) {
        const key = `_future_${action.choice.id}`;
        if (!s.flags[key]) {
          s = applyDelta(s, action.choice.futureDelta);
          s = {
            ...s,
            flags: { ...s.flags, [key]: true },
            log: [...s.log, { age: s.age, text: action.choice.futureMessage ?? 'A past decision paid off.' }],
          };
        }
      }
      // advance scenario pointer
      const nextIndex = state.scenarioIndex + 1;
      const bad = isBadChoice(action.choice);
      const consecutiveBadDecisions = bad ? state.consecutiveBadDecisions + 1 : 0;
      const financialHealthScore = computeFinancialHealthScore({
        savings: s.savings,
        happiness: s.happiness,
        debt: s.debt,
        consecutiveBadDecisions,
      });

      const ch = CHAPTERS.find((c) => c.id === state.chapterId);
      let chapterScenarioIds = state.chapterScenarioIds;
      let recentlyAddedScenarioIds: string[] = [];

      if (ch && nextIndex >= MIN_SCENARIOS) {
        const targetLength = getChapterTargetLength(financialHealthScore);
        const result = appendBonusScenarios(ch, chapterScenarioIds, targetLength);
        chapterScenarioIds = result.ids;
        recentlyAddedScenarioIds = result.added;
      }

      s = {
        ...s,
        scenarioIndex: nextIndex,
        financialHealthScore,
        consecutiveBadDecisions,
        chapterScenarioIds,
        recentlyAddedScenarioIds,
      };
      return s;
    }
    case 'COMPLETE_CHAPTER': {
      const completed = state.chaptersCompleted.includes(action.chapter.id)
        ? state.chaptersCompleted
        : [...state.chaptersCompleted, action.chapter.id];
      const chapterProgress = {
        ...state.chapterProgress,
        [action.chapter.id]: state.chapterScenarioIds,
      };
      return {
        ...state,
        chaptersCompleted: completed,
        chapterId: null,
        scenarioIndex: 0,
        chapterScenarioIds: [],
        recentlyAddedScenarioIds: [],
        chapterProgress,
        age: Math.max(state.age, action.chapter.endAge),
        pendingLessonDate: todayKey(),
      };
    }
    case 'CLEAR_RECENTLY_ADDED':
      return { ...state, recentlyAddedScenarioIds: [] };
    case 'COMPLETE_STREAK_TERM': {
      const today = todayKey();
      const termsLearned = state.termsLearned.includes(action.termId)
        ? state.termsLearned
        : [...state.termsLearned, action.termId];

      const lessonDoneToday = state.pendingLessonDate === today;
      const alreadyStreakedToday = state.lastStreakDate === today;

      let streakCount = state.streakCount;
      let lastStreakDate = state.lastStreakDate;

      if (lessonDoneToday && !alreadyStreakedToday) {
        streakCount = computeNewStreak(state.streakCount, state.lastStreakDate, today);
        lastStreakDate = today;
      }

      return {
        ...state,
        termsLearned,
        streakCount,
        lastStreakDate,
        pendingLessonDate: lessonDoneToday ? null : state.pendingLessonDate,
      };
    }
    case 'MARK_TERMS_SEEN': {
      const next = new Set(state.termsSeen);
      for (const n of action.termNames) next.add(n);
      return { ...state, termsSeen: Array.from(next) };
    }
    default:
      return state;
  }
}

type Ctx = {
  state: GameState;
  startChapter: (id: string) => void;
  applyChoice: (choice: Choice, scenario: Scenario) => void;
  completeChapter: (ch: Chapter) => void;
  completeStreakTerm: (termId: string) => void;
  markTermsSeen: (termNames: string[]) => void;
  reset: () => void;
  completeIntro: (playerName: string) => void;
  clearRecentlyAdded: () => void;
  hydrated: boolean;
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [hydrated, setHydrated] = React.useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as GameState;
          const merged = { ...INITIAL, ...parsed, recentlyAddedScenarioIds: [] };
          if (
            merged.chapterId &&
            (!merged.chapterScenarioIds || merged.chapterScenarioIds.length === 0)
          ) {
            const ch = CHAPTERS.find((c) => c.id === merged.chapterId);
            if (ch) {
              merged.chapterScenarioIds = getOrderedChapterScenarios(ch).slice(0, MIN_SCENARIOS).map((s) => s.id);
            }
          }
          merged.chapterProgress = merged.chapterProgress ?? {};
          merged.financialHealthScore =
            merged.financialHealthScore ?? computeFinancialHealthScore(merged);
          merged.consecutiveBadDecisions = merged.consecutiveBadDecisions ?? 0;
          dispatch({ type: 'HYDRATE', state: merged });
        }
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    for (const id of state.chaptersCompleted) {
      setChapterStatusDone(id).catch(() => {});
    }
  }, [state.chaptersCompleted, hydrated]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      startChapter: (id) => dispatch({ type: 'START_CHAPTER', chapterId: id }),
      applyChoice: (choice, scenario) => dispatch({ type: 'APPLY_CHOICE', choice, scenario }),
      completeChapter: (ch) => dispatch({ type: 'COMPLETE_CHAPTER', chapter: ch }),
      completeStreakTerm: (termId) => dispatch({ type: 'COMPLETE_STREAK_TERM', termId }),
      markTermsSeen: (termNames) => dispatch({ type: 'MARK_TERMS_SEEN', termNames }),
      reset: () => dispatch({ type: 'RESET' }),
      completeIntro: (playerName) => dispatch({ type: 'COMPLETE_INTRO', playerName }),
      clearRecentlyAdded: () => dispatch({ type: 'CLEAR_RECENTLY_ADDED' }),
    }),
    [state, hydrated],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
}

export { CHAPTERS };
