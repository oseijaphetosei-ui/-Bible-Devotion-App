export type PlanCategory = 'biblical' | 'topical';

export type PassageRef = {
  book: string;
  bookIndex: number;
  chapter: number;
};

export type ReadingDay = {
  day: number;
  title: string;
  reflection: string;
  estimatedMinutes: number;
  passages: PassageRef[];
};

export type ReadingPlan = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  totalDays: number;
  dailyMinutes: number;
  category: PlanCategory;
  gradient: readonly [string, string];
  icon: string;
  readings: ReadingDay[];
};

export type ActivePlan = {
  planId: string;
  startDate: string;
  currentDay: number;
  completedDays: number[];
  streak: number;
  lastCompletedDate: string | null;
};

export type HighlightColor = '#C9A96B' | '#6E8B74' | '#8B7BA4';

export type HighlightedVerse = {
  passageKey: string;
  verseNumber: number;
  text: string;
  color: HighlightColor;
};
