import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal } from '../types/goal';

const KEY = 'spiritual_goals';

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function calcStreak(completedDates: string[]): number {
  const sorted = [...new Set(completedDates)].sort().reverse();
  let streak = 0;
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  // Streak counts only if today or yesterday is included (allows checking off any time today)
  if (!sorted.includes(today) && !sorted.includes(yesterday)) return 0;
  let cursor = sorted.includes(today) ? today : yesterday;
  for (const date of sorted) {
    if (date === cursor) {
      streak++;
      const d = new Date(cursor);
      d.setDate(d.getDate() - 1);
      cursor = d.toISOString().slice(0, 10);
    } else if (date < cursor) {
      break;
    }
  }
  return streak;
}

export function isCompletedToday(goal: Goal): boolean {
  return goal.completedDates.includes(todayStr());
}

export async function loadGoals(): Promise<Goal[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(goals));
}

export async function addGoal(title: string, target: number): Promise<Goal> {
  const goals = await loadGoals();
  const goal: Goal = {
    id: Date.now().toString(),
    title,
    target,
    completedDates: [],
    createdAt: new Date().toISOString(),
  };
  await saveGoals([...goals, goal]);
  return goal;
}

export async function toggleTodayComplete(id: string): Promise<Goal[]> {
  const goals = await loadGoals();
  const today = todayStr();
  const updated = goals.map(g => {
    if (g.id !== id) return g;
    const already = g.completedDates.includes(today);
    return {
      ...g,
      completedDates: already
        ? g.completedDates.filter(d => d !== today)
        : [...g.completedDates, today],
    };
  });
  await saveGoals(updated);
  return updated;
}

export async function updateGoal(id: string, title: string, target: number): Promise<Goal[]> {
  const goals = await loadGoals();
  const updated = goals.map(g => g.id === id ? { ...g, title, target } : g);
  await saveGoals(updated);
  return updated;
}

export async function deleteGoal(id: string): Promise<Goal[]> {
  const goals = await loadGoals();
  const updated = goals.filter(g => g.id !== id);
  await saveGoals(updated);
  return updated;
}
