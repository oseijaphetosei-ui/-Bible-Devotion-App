import { DAILY_VERSES, type DailyVerse } from '../data/verses';
import { loadChapter, type BibleVersion } from './bibleService';

export type ResolvedVerse = DailyVerse & { text: string };

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function getTodayVerseEntry(): DailyVerse {
  return DAILY_VERSES[dayOfYear() % DAILY_VERSES.length];
}

export async function fetchTodayVerse(bible: BibleVersion): Promise<ResolvedVerse> {
  const entry = getTodayVerseEntry();
  try {
    const { verses } = await loadChapter(entry.bookIndex, entry.usfm, entry.chapter, bible);
    const match = verses.find((v) => v.verse === entry.verse);
    return { ...entry, text: match?.text ?? entry.fallbackText };
  } catch {
    return { ...entry, text: entry.fallbackText };
  }
}
