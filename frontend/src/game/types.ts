export type StatDelta = {
  cash?: number;
  savings?: number;
  debt?: number;
  happiness?: number;
  knowledge?: number;
};

export type Choice = {
  id: string;
  label: string;
  hint?: string;
  delta: StatDelta;
  setFlags?: string[];
  // Future age at which a delayed consequence triggers
  futureAge?: number;
  futureDelta?: StatDelta;
  futureMessage?: string;
  // 4-beat structure additions
  consequenceText: string; // Beat 3 - what happened, in plain English
  lesson: string; // Beat 4 - the financial idea behind it
  concept: string; // Short tag like "Opportunity Cost" / "Compound Interest"
};

export type Scenario = {
  id: string;
  age: number;
  title: string;
  prompt: string; // The SITUATION (Beat 1)
  scene: 'home' | 'street' | 'school' | 'phone' | 'college' | 'hostel' | 'bank';
  choices: Choice[];
  // years to fast-forward after this decision
  advanceYears: number;
};

export type Chapter = {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  ageRange: string;
  scenarios: Scenario[];
  endAge: number;
  // Roadmap landscape palette
  landscape: {
    sky: [string, string];
    ground: string;
    accent: string; // hut/building color
    name: string; // e.g., "VILLAGE", "NEIGHBOURHOOD"
  };
};

export type GameState = {
  age: number;
  cash: number;
  savings: number;
  debt: number;
  happiness: number;
  knowledge: number;
  flags: Record<string, boolean>;
  chapterId: string | null;
  scenarioIndex: number;
  chaptersCompleted: string[];
  log: { age: number; text: string }[];
  // Onboarding
  playerName: string | null;
  introCompleted: boolean;
  // Streaks — lesson + financial term on the same day
  streakCount: number;
  lastStreakDate: string | null;
  pendingLessonDate: string | null;
  termsLearned: string[];
};
