import AsyncStorage from '@react-native-async-storage/async-storage';
import { Prayer, PrayerCategory, PrayerStatus, PrayerStats, AnswerReflection } from '../types/prayer';

const KEY = '@prayer_journal_v1';

let cache: Prayer[] | null = null;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function loadPrayers(): Promise<Prayer[]> {
  if (cache !== null) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : [];
    return cache!;
  } catch {
    return [];
  }
}

async function persist(prayers: Prayer[]): Promise<void> {
  cache = prayers;
  await AsyncStorage.setItem(KEY, JSON.stringify(prayers));
}

export async function addPrayer(
  input: Omit<Prayer, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Prayer> {
  const prayers = await loadPrayers();
  const now = new Date().toISOString();
  const prayer: Prayer = { ...input, id: uid(), createdAt: now, updatedAt: now };
  await persist([prayer, ...prayers]);
  return prayer;
}

export async function updatePrayer(
  id: string,
  patch: Partial<Omit<Prayer, 'id' | 'createdAt'>>,
): Promise<Prayer | null> {
  const prayers = await loadPrayers();
  const idx = prayers.findIndex(p => p.id === id);
  if (idx < 0) return null;
  const updated: Prayer = { ...prayers[idx], ...patch, updatedAt: new Date().toISOString() };
  prayers[idx] = updated;
  await persist([...prayers]);
  return updated;
}

export async function deletePrayer(id: string): Promise<void> {
  const prayers = await loadPrayers();
  await persist(prayers.filter(p => p.id !== id));
}

export async function getPrayerById(id: string): Promise<Prayer | null> {
  const prayers = await loadPrayers();
  return prayers.find(p => p.id === id) ?? null;
}

export async function markAnswered(id: string, reflection?: AnswerReflection): Promise<Prayer | null> {
  return updatePrayer(id, {
    status: 'answered',
    answeredAt: new Date().toISOString(),
    ...(reflection ? { answerReflection: reflection } : {}),
  });
}

export async function toggleFavorite(id: string): Promise<Prayer | null> {
  const prayers = await loadPrayers();
  const prayer = prayers.find(p => p.id === id);
  if (!prayer) return null;
  return updatePrayer(id, { isFavorite: !prayer.isFavorite });
}

export async function getPrayerStats(): Promise<PrayerStats> {
  const prayers = await loadPrayers();
  const active   = prayers.filter(p => p.status === 'active').length;
  const answered = prayers.filter(p => p.status === 'answered').length;
  const waiting  = prayers.filter(p => p.status === 'waiting').length;
  const ongoing  = prayers.filter(p => p.status === 'ongoing').length;

  const days = new Set(prayers.map(p => p.createdAt.slice(0, 10)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak++;
    else break;
  }

  return { total: prayers.length, active, answered, waiting, ongoing, streak };
}

export function filterPrayers(
  prayers: Prayer[],
  opts: {
    query?: string;
    status?: PrayerStatus | 'all';
    category?: PrayerCategory | 'all';
    favoritesOnly?: boolean;
  },
): Prayer[] {
  let result = [...prayers];
  if (opts.status && opts.status !== 'all') result = result.filter(p => p.status === opts.status);
  if (opts.category && opts.category !== 'all') result = result.filter(p => p.category === opts.category);
  if (opts.favoritesOnly) result = result.filter(p => p.isFavorite);
  if (opts.query?.trim()) {
    const q = opts.query.toLowerCase();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.bibleRef?.label.toLowerCase().includes(q) ?? false) ||
      p.tags.some(t => t.toLowerCase().includes(q)),
    );
  }
  return result;
}

export function invalidateCache(): void {
  cache = null;
}
