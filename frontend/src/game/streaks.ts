export type FinancialTerm = {
  id: string;
  word: string;
  emoji: string;
  meaning: string;
};

export const FINANCIAL_TERMS: FinancialTerm[] = [
  {
    id: 'budget',
    word: 'Budget',
    emoji: '💰',
    meaning: "A plan for how you'll spend and save your money.",
  },
  {
    id: 'savings',
    word: 'Savings',
    emoji: '🏦',
    meaning: 'Money you keep aside for future use instead of spending it.',
  },
  {
    id: 'investment',
    word: 'Investment',
    emoji: '📈',
    meaning: 'Putting money into something with the hope it grows over time.',
  },
  {
    id: 'debt',
    word: 'Debt',
    emoji: '💳',
    meaning: 'Money you owe to someone else and need to pay back.',
  },
  {
    id: 'interest',
    word: 'Interest',
    emoji: '📊',
    meaning: 'Extra money earned on savings or paid when borrowing money.',
  },
];

export function todayKey(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function pickTerm(termsLearned: string[], chaptersCompleted: number): FinancialTerm {
  const unlearned = FINANCIAL_TERMS.filter((t) => !termsLearned.includes(t.id));
  if (unlearned.length > 0) return unlearned[0];
  return FINANCIAL_TERMS[chaptersCompleted % FINANCIAL_TERMS.length];
}

export function computeNewStreak(
  currentStreak: number,
  lastStreakDate: string | null,
  today: string,
): number {
  if (lastStreakDate === today) return currentStreak;
  if (lastStreakDate === yesterdayKey()) return currentStreak + 1;
  return 1;
}
