import { Choice, GameState } from './types';

export const MIN_SCENARIOS = 3;
export const MAX_BONUS_SCENARIOS = 4;

export function computeFinancialHealthScore(
  state: Pick<GameState, 'savings' | 'happiness' | 'debt' | 'consecutiveBadDecisions'>,
): number {
  const savingsBonus = Math.min(state.savings / 500, 25);
  const moodBonus = state.happiness * 0.25;
  const debtPenalty = Math.min(state.debt / 1000, 25);
  const streakPenalty = state.consecutiveBadDecisions * 8;
  return Math.max(
    0,
    Math.min(100, Math.round(50 + savingsBonus + moodBonus - debtPenalty - streakPenalty)),
  );
}

export function isBadChoice(choice: Choice): boolean {
  const d = choice.delta;
  if ((d.debt ?? 0) > 0) return true;
  if ((d.savings ?? 0) < -100) return true;
  if ((d.happiness ?? 0) < -5) return true;
  if ((d.cash ?? 0) < -500 && (d.savings ?? 0) <= 0) return true;
  return false;
}

export function bonusScenariosNeeded(score: number): number {
  if (score >= 80) return 0;
  if (score >= 70) return 1;
  if (score >= 60) return 2;
  if (score >= 45) return 3;
  return MAX_BONUS_SCENARIOS;
}

export function getChapterTargetLength(score: number): number {
  return MIN_SCENARIOS + bonusScenariosNeeded(score);
}

export function resolveChapterScenarioIds(
  chapterId: string,
  scenarioIds: string[],
  allScenarios: { id: string }[],
): string[] {
  const valid = new Set(allScenarios.map((s) => s.id));
  const resolved = scenarioIds.filter((id) => valid.has(id));
  if (resolved.length >= MIN_SCENARIOS) return resolved;
  return allScenarios.slice(0, MIN_SCENARIOS).map((s) => s.id);
}
