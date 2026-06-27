import { LabAccelEvent } from '@/src/components/finlabs/LabUI';

export const START_WALLET = 200;
export const START_MOOD = 70;

export type Plan = {
  buyPen: boolean;
  canteen: number;
  chipGift: boolean;
  goPark: boolean;
};

export type DayDef = {
  id: string;
  short: string;
  title: string;
  tag: string;
  situation: string;
  emoji: string;
};

export const WEEK_DAYS: DayDef[] = [
  {
    id: 'mon',
    short: 'MON',
    title: 'PEN EMERGENCY',
    tag: 'MONDAY · NEED',
    situation:
      'Monday morning. Your pen ran out before the maths test. The school shop sells one for Rs 15. You could skip it and borrow — but the teacher notices when students borrow every week.',
    emoji: '✏️',
  },
  {
    id: 'tue',
    short: 'TUE',
    title: 'CANTEEN LUNCH',
    tag: 'TUESDAY · SOCIAL',
    situation:
      'Tuesday lunch break. Your friends are heading to the canteen. Eating with them costs Rs 10–Rs 60 depending on what you order. Bringing food from home costs Rs 0 but you sit alone.',
    emoji: '🍱',
  },
  {
    id: 'wed',
    short: 'WED',
    title: 'BIRTHDAY GIFT POOL',
    tag: 'WEDNESDAY · FRIENDSHIP',
    situation:
      'Wednesday after school. Your class is collecting Rs 20 each for a birthday gift for Riya. Everyone else has chipped in. Skipping saves money but Riya might notice.',
    emoji: '🎁',
  },
  {
    id: 'thu',
    short: 'THU',
    title: 'QUIET DAY',
    tag: 'THURSDAY · REST',
    situation:
      'Thursday has no planned spending. A good day to check your wallet and see if your plan is on track before the weekend.',
    emoji: '😌',
  },
  {
    id: 'fri',
    short: 'FRI',
    title: 'PARK TRIP',
    tag: 'FRIDAY · FUN',
    situation:
      'Friday evening. Friends are going to the neighbourhood park — entry and snacks cost Rs 30 total. It is the most fun event of the week, but only if you still have the money.',
    emoji: '🎡',
  },
];

export type DayOutcome = {
  day: string;
  emoji: string;
  headline: string;
  wallet: number;
  mood: number;
  walletFrom: number;
  moodFrom: number;
  walletDelta: number;
  moodDelta: number;
  events: LabAccelEvent[];
};

export function calcPlannedSpend(plan: Plan) {
  let spend = plan.canteen;
  if (plan.buyPen) spend += 15;
  if (plan.chipGift) spend += 20;
  if (plan.goPark) spend += 30;
  return spend;
}

function clampMood(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildDayOutcomes(plan: Plan): DayOutcome[] {
  let wallet = START_WALLET;
  let mood = START_MOOD;
  const outcomes: DayOutcome[] = [];

  // MON
  {
    const walletFrom = wallet;
    const moodFrom = mood;
    let walletDelta = 0;
    let moodDelta = 0;
    let headline = '';
    let story = '';

    if (plan.buyPen) {
      walletDelta = -15;
      wallet += walletDelta;
      headline = 'Pen bought — ready for class';
      story = 'You bought the pen for Rs 15. You are prepared for the maths test. No borrowing needed.';
    } else {
      moodDelta = -5;
      mood = clampMood(mood + moodDelta);
      headline = 'Skipped the pen — borrowed in class';
      story =
        'You skipped the pen to save money. In class you had to borrow one and your teacher noticed. That felt awkward.';
    }

    outcomes.push(makeOutcome('MONDAY', '✏️', headline, walletFrom, moodFrom, wallet, mood, walletDelta, moodDelta, story));
  }

  // TUE
  {
    const walletFrom = wallet;
    const moodFrom = mood;
    let walletDelta = 0;
    let moodDelta = 0;
    let headline = '';
    let story = '';

    if (plan.canteen > 0) {
      walletDelta = -plan.canteen;
      wallet += walletDelta;
      moodDelta = Math.min(plan.canteen / 10, 8);
      mood = clampMood(mood + moodDelta);
      headline = `Canteen lunch — Rs ${plan.canteen} spent`;
      story = `You spent Rs ${plan.canteen} at the canteen with friends. You fit in and enjoyed lunch together.`;
    } else {
      moodDelta = -3;
      mood = clampMood(mood + moodDelta);
      headline = 'Ate from home — saved money';
      story = 'You brought food from home and saved money, but you ate alone while friends were at the canteen.';
    }

    outcomes.push(makeOutcome('TUESDAY', '🍱', headline, walletFrom, moodFrom, wallet, mood, walletDelta, moodDelta, story));
  }

  // WED
  {
    const walletFrom = wallet;
    const moodFrom = mood;
    let walletDelta = 0;
    let moodDelta = 0;
    let headline = '';
    let story = '';

    if (plan.chipGift) {
      walletDelta = -20;
      wallet += walletDelta;
      moodDelta = 8;
      mood = clampMood(mood + moodDelta);
      headline = 'Gift pool — chipped in Rs 20';
      story = 'You chipped in Rs 20 for Riya\'s gift. She smiled when she saw your name on the card.';
    } else {
      moodDelta = -10;
      mood = clampMood(mood + moodDelta);
      headline = 'Skipped the gift pool';
      story = 'You skipped the Rs 20 gift pool. Riya noticed you were the only one who did not contribute.';
    }

    outcomes.push(makeOutcome('WEDNESDAY', '🎁', headline, walletFrom, moodFrom, wallet, mood, walletDelta, moodDelta, story));
  }

  // THU
  {
    const walletFrom = wallet;
    const moodFrom = mood;
    outcomes.push(
      makeOutcome(
        'THURSDAY',
        '😌',
        'Quiet day — checked your wallet',
        walletFrom,
        moodFrom,
        wallet,
        mood,
        0,
        0,
        `No spending today. You opened your wallet and counted Rs ${wallet} left. Your plan is ${wallet >= 0 ? 'still on track' : 'in trouble'}.`,
      ),
    );
  }

  // FRI
  {
    const walletFrom = wallet;
    const moodFrom = mood;
    let walletDelta = 0;
    let moodDelta = 0;
    let headline = '';
    let story = '';

    if (plan.goPark) {
      if (wallet >= 30) {
        walletDelta = -30;
        wallet += walletDelta;
        moodDelta = 12;
        mood = clampMood(mood + moodDelta);
        headline = 'Park trip — best day of the week';
        story = 'PARK DAY! You spent Rs 30 and went with friends. Best day of the week.';
      } else {
        moodDelta = -8;
        mood = clampMood(mood + moodDelta);
        headline = 'Planned park but ran out of money';
        story = `You planned the park trip but only had Rs ${wallet} left. You could not afford the Rs 30. Friends went without you.`;
      }
    } else {
      moodDelta = -5;
      mood = clampMood(mood + moodDelta);
      headline = 'Skipped the park trip';
      story = 'You skipped the park to save money. Friends went without you and shared photos later.';
    }

    outcomes.push(makeOutcome('FRIDAY', '🎡', headline, walletFrom, moodFrom, wallet, mood, walletDelta, moodDelta, story));
  }

  return outcomes;
}

function makeOutcome(
  day: string,
  emoji: string,
  headline: string,
  walletFrom: number,
  moodFrom: number,
  wallet: number,
  mood: number,
  walletDelta: number,
  moodDelta: number,
  story: string,
): DayOutcome {
  const events: LabAccelEvent[] = [
    {
      kind: 'day',
      title: day,
      emoji,
      text: `${day} arrives. ${headline}.`,
    },
    {
      kind: 'story',
      title: 'WHAT HAPPENED',
      emoji: '📜',
      text: story,
    },
  ];

  if (walletDelta !== 0) {
    events.push({
      kind: 'stat',
      title: 'WALLET',
      emoji: '💰',
      label: 'WALLET',
      text:
        walletDelta < 0
          ? `You spent Rs ${Math.abs(walletDelta)} from your wallet.`
          : `You gained Rs ${walletDelta} in your wallet.`,
      from: walletFrom,
      to: wallet,
      format: 'inr',
      positive: walletDelta >= 0,
    });
  }

  if (moodDelta !== 0) {
    events.push({
      kind: 'stat',
      title: 'MOOD',
      emoji: moodDelta > 0 ? '😊' : '😟',
      label: 'MOOD',
      text:
        moodDelta > 0
          ? `Your mood lifted by ${Math.abs(moodDelta)} points. You felt better about life.`
          : `Your mood dropped by ${Math.abs(moodDelta)} points. The decision weighed on you.`,
      from: moodFrom,
      to: mood,
      format: 'mood',
      positive: moodDelta >= 0,
    });
  }

  return {
    day,
    emoji,
    headline,
    wallet,
    mood,
    walletFrom,
    moodFrom,
    walletDelta,
    moodDelta,
    events,
  };
}

export function getResultTag(wallet: number, mood: number) {
  if (wallet >= 80 && mood >= 70) return 'BALANCED PLANNER 🎯';
  if (wallet >= 100) return 'THE SAVER 🐷  — but did you have fun?';
  if (mood >= 80) return 'FULL LIFE MODE 🎉 — wallet felt it though';
  if (wallet < 20) return 'SPENT IT ALL 😅 — one emergency would hurt';
  return 'YOU SURVIVED THE WEEK 💪';
}

export function getTotalSpent(plan: Plan, finalWallet: number) {
  return START_WALLET - finalWallet;
}
