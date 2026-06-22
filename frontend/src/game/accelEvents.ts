import { Choice, GameState, Scenario } from './types';

export type AccelEvent =
  | {
      kind: 'time';
      title: string;
      emoji: string;
      text: string;
    }
  | {
      kind: 'story';
      title: string;
      emoji: string;
      text: string;
    }
  | {
      kind: 'stat';
      title: string;
      emoji: string;
      label: string; // e.g., "SAVINGS"
      text: string; // complete sentence narration
      from: number;
      to: number;
      format: 'inr' | 'plain100';
      positive: boolean;
    }
  | {
      kind: 'arrival';
      title: string;
      emoji: string;
      text: string;
    }
  | {
      kind: 'future';
      title: string;
      emoji: string;
      text: string;
    };

export function buildAccelEvents(
  prev: Pick<GameState, 'age' | 'cash' | 'savings' | 'debt' | 'happiness' | 'knowledge'>,
  next: Pick<GameState, 'age' | 'cash' | 'savings' | 'debt' | 'happiness' | 'knowledge'>,
  choice: Choice,
  scenario: Scenario,
): AccelEvent[] {
  const yrs = scenario.advanceYears;
  const events: AccelEvent[] = [];

  // 1. Time passes
  events.push({
    kind: 'time',
    title: 'TIME ACCELERATES',
    emoji: '⏳',
    text: yrs === 1 ? '1 year passes. The seasons change.' : `${yrs} years pass. The seasons cycle by.`,
  });

  // 2. The story — what actually happened (from the choice's consequenceText)
  events.push({
    kind: 'story',
    title: 'WHAT HAPPENED',
    emoji: '📜',
    text: choice.consequenceText,
  });

  // 3. Stat changes — one at a time, with complete sentence
  if (next.cash !== prev.cash) {
    const delta = next.cash - prev.cash;
    events.push({
      kind: 'stat',
      title: 'CASH',
      emoji: '💰',
      label: 'CASH',
      text:
        delta < 0
          ? `You spent ₹${Math.abs(delta).toLocaleString('en-IN')} in cash.`
          : `You gained ₹${delta.toLocaleString('en-IN')} in cash.`,
      from: prev.cash,
      to: next.cash,
      format: 'inr',
      positive: delta >= 0,
    });
  }

  if (next.savings !== prev.savings) {
    const delta = next.savings - prev.savings;
    const principalChange = (choice.delta.savings ?? 0);
    let text = '';
    if (principalChange > 0 && yrs > 0) {
      const interest = delta - principalChange;
      if (interest > 0) {
        text = `₹${principalChange.toLocaleString('en-IN')} added, then grew by ₹${interest.toLocaleString('en-IN')} from ${yrs}-yr compounding at 8%.`;
      } else {
        text = `₹${principalChange.toLocaleString('en-IN')} added to your savings.`;
      }
    } else if (principalChange < 0) {
      text = `₹${Math.abs(principalChange).toLocaleString('en-IN')} pulled out of savings.`;
    } else if (delta > 0) {
      text = `Compounding alone added ₹${delta.toLocaleString('en-IN')} to your savings over ${yrs} year${yrs > 1 ? 's' : ''}.`;
    } else {
      text = `Your savings shifted by ₹${delta.toLocaleString('en-IN')}.`;
    }
    events.push({
      kind: 'stat',
      title: 'SAVINGS',
      emoji: '🐷',
      label: 'SAVINGS',
      text,
      from: prev.savings,
      to: next.savings,
      format: 'inr',
      positive: delta >= 0,
    });
  }

  if (next.debt !== prev.debt) {
    const delta = next.debt - prev.debt;
    const principalChange = (choice.delta.debt ?? 0);
    let text = '';
    if (principalChange > 0) {
      text = `You took on ₹${principalChange.toLocaleString('en-IN')} of new debt. It also grew over ${yrs}yr.`;
    } else if (delta > 0) {
      text = `Existing debt grew by ₹${delta.toLocaleString('en-IN')} over time (unpaid interest).`;
    } else {
      text = `Debt shifted by ₹${delta.toLocaleString('en-IN')}.`;
    }
    events.push({
      kind: 'stat',
      title: 'DEBT',
      emoji: '💳',
      label: 'DEBT',
      text,
      from: prev.debt,
      to: next.debt,
      format: 'inr',
      positive: delta <= 0,
    });
  }

  if (next.happiness !== prev.happiness) {
    const delta = next.happiness - prev.happiness;
    events.push({
      kind: 'stat',
      title: 'MOOD',
      emoji: delta > 0 ? '😊' : '😟',
      label: 'MOOD',
      text:
        delta > 0
          ? `Your mood lifted by ${delta} points. You felt better about life.`
          : `Your mood dropped by ${Math.abs(delta)} points. The decision weighed on you.`,
      from: prev.happiness,
      to: next.happiness,
      format: 'plain100',
      positive: delta >= 0,
    });
  }

  if (next.knowledge !== prev.knowledge) {
    const delta = next.knowledge - prev.knowledge;
    events.push({
      kind: 'stat',
      title: 'KNOWLEDGE',
      emoji: '🧠',
      label: 'LEARN',
      text:
        delta > 0
          ? `Knowledge +${delta}. You understand "${choice.concept}" a little better now.`
          : `Knowledge ${delta}. Some confidence was lost.`,
      from: prev.knowledge,
      to: next.knowledge,
      format: 'plain100',
      positive: delta >= 0,
    });
  }

  // 4. Arrival
  events.push({
    kind: 'arrival',
    title: 'YOU ARE NOW',
    emoji: '🎂',
    text: `You are now ${next.age} years old.`,
  });

  // 5. Future bonus
  if (choice.futureMessage) {
    events.push({
      kind: 'future',
      title: 'TURNING POINT',
      emoji: '✨',
      text: choice.futureMessage,
    });
  }

  return events;
}
