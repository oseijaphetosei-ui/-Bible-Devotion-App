export type Goal = {
  id: string;
  title: string;
  target: number; // days
  completedDates: string[]; // 'YYYY-MM-DD'
  createdAt: string;
};

export type GoalTemplate = {
  title: string;
  target: number;
  icon: string;
};

export const GOAL_TEMPLATES: GoalTemplate[] = [
  { title: 'Read Bible daily',     target: 30, icon: '📖' },
  { title: 'Morning prayer',       target: 14, icon: '🙏' },
  { title: 'Evening reflection',   target: 21, icon: '✨' },
  { title: 'Memorize scripture',   target: 30, icon: '📝' },
  { title: 'Attend church',        target: 12, icon: '⛪' },
  { title: 'Fast weekly',          target: 12, icon: '🕊️' },
  { title: 'Share the gospel',     target: 10, icon: '❤️' },
  { title: 'Journal gratitude',    target: 30, icon: '📔' },
];
