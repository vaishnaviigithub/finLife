import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAPTERS } from './data';
import { computeNewStreak, todayKey } from './streaks';
import { setChapterStatusDone } from '../finlabs/storage';
import { Chapter, Choice, GameState, Scenario, StatDelta } from './types';

const STORAGE_KEY = '@finlife/state/v1';

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
};

type Action =
  | { type: 'HYDRATE'; state: GameState }
  | { type: 'RESET' }
  | { type: 'START_CHAPTER'; chapterId: string }
  | { type: 'APPLY_CHOICE'; choice: Choice; scenario: Scenario }
  | { type: 'COMPLETE_CHAPTER'; chapter: Chapter }
  | { type: 'COMPLETE_STREAK_TERM'; termId: string }
  | { type: 'COMPLETE_INTRO'; playerName: string };

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
      const startAge = ch.scenarios[0].age;
      // Top-up small monthly allowance entering the chapter to keep gameplay flowing
      return {
        ...state,
        chapterId: ch.id,
        scenarioIndex: 0,
        age: Math.max(state.age, startAge),
        cash: state.cash + (ch.index === 1 ? 500 : ch.index === 2 ? 5000 : 20000),
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
      // advance time + compound
      s = compound(s, action.scenario.advanceYears);
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
      s = { ...s, scenarioIndex: state.scenarioIndex + 1 };
      return s;
    }
    case 'COMPLETE_CHAPTER': {
      const completed = state.chaptersCompleted.includes(action.chapter.id)
        ? state.chaptersCompleted
        : [...state.chaptersCompleted, action.chapter.id];
      return {
        ...state,
        chaptersCompleted: completed,
        chapterId: null,
        scenarioIndex: 0,
        age: Math.max(state.age, action.chapter.endAge),
        pendingLessonDate: todayKey(),
      };
    }
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
  reset: () => void;
  completeIntro: (playerName: string) => void;
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
          dispatch({ type: 'HYDRATE', state: { ...INITIAL, ...parsed } });
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
      reset: () => dispatch({ type: 'RESET' }),
      completeIntro: (playerName) => dispatch({ type: 'COMPLETE_INTRO', playerName }),
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
