import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LEARNED_TERMS_KEY = 'finpedia_learned_terms';
export const QUIZ_MILESTONES_KEY = 'finpedia_quiz_milestones_done';

function uniqueSorted(values: number[]) {
  return Array.from(new Set(values.filter(Number.isFinite))).sort((a, b) => a - b);
}

function uniqueInOrder(values: number[]) {
  return Array.from(new Set(values.filter(Number.isFinite)));
}

async function readNumberArray(key: string) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const numbers = parsed.filter((value): value is number => typeof value === 'number');
    return key === LEARNED_TERMS_KEY ? uniqueInOrder(numbers) : uniqueSorted(numbers);
  } catch {
    return [];
  }
}

async function writeNumberArray(key: string, values: number[], preserveOrder = false) {
  await AsyncStorage.setItem(key, JSON.stringify(preserveOrder ? uniqueInOrder(values) : uniqueSorted(values)));
}

export function useTermProgress() {
  const [learnedTermIds, setLearnedTermIds] = useState<number[]>([]);
  const [quizMilestonesDone, setQuizMilestonesDone] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      readNumberArray(LEARNED_TERMS_KEY),
      readNumberArray(QUIZ_MILESTONES_KEY),
    ]).then(([storedLearned, storedMilestones]) => {
      if (!mounted) return;
      setLearnedTermIds(storedLearned);
      setQuizMilestonesDone(storedMilestones);
      setIsLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const learnedSet = useMemo(() => new Set(learnedTermIds), [learnedTermIds]);
  const quizMilestoneSet = useMemo(() => new Set(quizMilestonesDone), [quizMilestonesDone]);

  const markLearned = useCallback(async (termId: number) => {
    let nextIds: number[] | null = null;

    setLearnedTermIds((current) => {
      if (current.includes(termId)) return current;
      nextIds = uniqueInOrder([...current, termId]);
      return nextIds;
    });

    if (nextIds) {
      await writeNumberArray(LEARNED_TERMS_KEY, nextIds, true);
    }
  }, []);

  const markQuizMilestoneDone = useCallback(async (milestone: number) => {
    let nextMilestones: number[] | null = null;

    setQuizMilestonesDone((current) => {
      if (current.includes(milestone)) return current;
      nextMilestones = uniqueSorted([...current, milestone]);
      return nextMilestones;
    });

    if (nextMilestones) {
      await writeNumberArray(QUIZ_MILESTONES_KEY, nextMilestones);
    }
  }, []);

  return {
    isLoaded,
    learnedTermIds,
    learnedSet,
    quizMilestonesDone,
    quizMilestoneSet,
    markLearned,
    markQuizMilestoneDone,
  };
}
