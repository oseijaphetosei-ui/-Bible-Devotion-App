import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPLETED_DATES_KEY = 'devotion_completed_dates';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getCompletedDates(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(COMPLETED_DATES_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveCompletedDates(dates: string[]): Promise<void> {
  await AsyncStorage.setItem(COMPLETED_DATES_KEY, JSON.stringify(dates));
}

export async function markTodayComplete(): Promise<void> {
  const dates = await getCompletedDates();
  const today = todayStr();
  if (!dates.includes(today)) {
    await saveCompletedDates([...dates, today]);
  }
}

export async function unmarkToday(): Promise<void> {
  const dates = await getCompletedDates();
  await saveCompletedDates(dates.filter(d => d !== todayStr()));
}

export async function isCompletedToday(): Promise<boolean> {
  const dates = await getCompletedDates();
  return dates.includes(todayStr());
}

export async function getStreakData(): Promise<{
  streak: number;
  total: number;
  completedDates: string[];
  weekDays: { dateStr: string; label: string; dayNum: number; completed: boolean; isToday: boolean }[];
}> {
  const completed = await getCompletedDates();
  const completedSet = new Set(completed);

  // Current consecutive streak (counting backwards from today)
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (completedSet.has(dateStr(d))) {
      streak++;
    } else {
      break;
    }
  }

  // 7-day calendar (Sun → Sat of current week)
  const dow = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - dow);
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const ds = dateStr(d);
    return {
      dateStr: ds,
      label: DAY_LABELS[i],
      dayNum: d.getDate(),
      completed: completedSet.has(ds),
      isToday: i === dow,
    };
  });

  return { streak, total: completed.length, completedDates: completed, weekDays };
}
